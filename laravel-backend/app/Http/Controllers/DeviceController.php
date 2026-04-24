<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\User;
use App\Models\ScheduleModel;
use App\Models\ActivityModel;
use App\Services\SocketService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use App\Models\AttendanceLogs;
use Carbon\Carbon;

class DeviceController extends Controller
{

    public function heartbeat(Request $request)
    {
        try {
            $request->validate(['pairing_token' => 'required|string']);

            // Allow both paired and unpaired devices to send heartbeat
            $device = Device::where('pairing_token', $request->pairing_token)->first();

            if (!$device) {
                return response()->json(['success' => false, 'message' => 'Device not found'], 404);
            }

            $device->last_seen = now();
            $device->status    = 'online';
            $device->save();
            (new SocketService())->emitDeviceUpdate([
                'device_id'  => $device->id,
                'name'       => $device->name,
                'status'     => 'online',
                'last_seen'  => now()->toISOString(),
            ]);
            return response()->json(['success' => true, 'message' => 'Heartbeat received']);

        } catch (\Exception $e) {
            \Log::error('Heartbeat error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Server error'], 500);
        }
    }

    public function index()
    {
        Device::where('status', 'online')
            ->where('last_seen', '<', now()->subSeconds(35))
            ->update(['status' => 'offline']);

        return response()->json(Device::orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'wifi_ssid'     => 'required|string|max:100',
            'wifi_password' => 'required|string|max:100',
            'server_url'    => 'required|string|max:255',
            'scan_cooldown' => 'integer|min:1000|max:10000',
        ]);

        $device = Device::create([
            ...$data,
            'pairing_token' => 'tok_' . Str::random(32),
            'status'        => 'offline',
            'paired'        => false,
        ]);

        return response()->json($device, 201);
    }

    public function update(Request $request, $id)
    {
        $device = Device::findOrFail($id);
        $data   = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'wifi_ssid'     => 'sometimes|string|max:100',
            'wifi_password' => 'sometimes|string|max:100',
            'server_url'    => 'sometimes|string|max:255',
            'scan_cooldown' => 'sometimes|integer|min:1000|max:10000',
        ]);
        $device->update($data);
        return response()->json($device);
    }

    public function destroy($id)
    {
        Device::findOrFail($id)->delete();
        return response()->json(['message' => 'Device removed']);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'pairing_token' => 'required|string',
            'chip_id'       => 'nullable|string',
            'mac_address'   => 'nullable|string',
        ]);

        $device = Device::where('pairing_token', $data['pairing_token'])->first();

        if (!$device) {
            return response()->json(['error' => 'Invalid pairing token'], 404);
        }

        if ($device->paired) {
            $device->update(['last_seen' => now()]);
            return response()->json(['message' => 'Already paired', 'device' => $device]);
        }

        $device->update([
            'chip_id'     => $data['chip_id'],
            'mac_address' => $data['mac_address'],
            'paired'      => true,
            'status'      => 'online',
            'last_seen'   => now(),
        ]);

        return response()->json(['message' => 'Device paired successfully', 'device' => $device], 201);
    }

    public function scan(Request $request)
    {
        try {
            \Log::info('==== SCAN REQUEST START ====');
            \Log::info('Request data:', $request->all());

            $instructor_id = $request->input('employee_id') ?? $request->input('instructor_id');
            $pairing_token = $request->input('pairing_token');

            if (!$instructor_id) {
                return response()->json(['success' => false, 'message' => 'Instructor ID is required'], 422);
            }
            if (!$pairing_token) {
                return response()->json(['success' => false, 'message' => 'Pairing token is required'], 422);
            }

            // Find device
            $device = \App\Models\Device::where('pairing_token', $pairing_token)
                ->where('paired', true)
                ->first();

            if (!$device) {
                return response()->json(['success' => false, 'message' => 'Device not found or not paired'], 404);
            }
            \Log::info('Device found:', ['device_id' => $device->id]);

            // Find user
            $user = \App\Models\User::where('instructor_id', $instructor_id)->first();

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not found with Instructor ID: ' . $instructor_id], 404);
            }
            \Log::info('User found:', ['user_id' => $user->id, 'name' => $user->name, 'role' => $user->role]);

            // Parse device time (Unix timestamp) or fall back to server time
            $deviceTimeUnix = $request->input('device_time');
            if ($deviceTimeUnix) {
                // ✅ FIXED: convert UTC timestamp to Philippine time
                $now = \Carbon\Carbon::createFromTimestamp($deviceTimeUnix)->setTimezone('Asia/Manila');
                \Log::info('Using device time: ' . $now);
            } else {
                $now = now();
                \Log::info('No device time provided, using server time: ' . $now);
            }

            // Find ongoing schedule
            $schedule = null;
            if ($user->role === 'instructor') {
                \Log::info('Looking for Ongoing schedule for: ' . $user->instructor_id);
                $schedule = \App\Models\ScheduleModel::where('instructor_id', $user->instructor_id)
                    ->where('status', 'Ongoing')
                    ->first();

                if ($schedule) {
                    \Log::info('✅ Found ongoing schedule:', ['schedule_id' => $schedule->id, 'subject' => $schedule->subject]);
                } else {
                    \Log::info('❌ No ongoing schedule found');
                }
            }

            // Update user scan status
            $user->scan_status     = 'scanned';
            $user->last_scanned_at = $now;
            $user->save();

            // Update device
            $device->last_seen = $now;
            $device->status    = 'online';
            $device->save();

            $responseData = [
                'success'   => true,
                'name'      => $user->name,
                'scan_time' => $now->format('Y-m-d H:i:s'),
            ];

            if ($schedule && $schedule->status != 'Absent') {
                // Determine if late: Check if scan time is > 20 mins after schedule start time
                $scheduleStartToday = \Carbon\Carbon::today()->setTimeFromTimeString($schedule->time);
                $minutesLate = $now->diffInMinutes($scheduleStartToday);
                
                $isLate = $minutesLate > 20;
                $attendanceStatus = $isLate ? 'Late' : 'Present';
                $scheduleStatus = $isLate ? 'Late' : 'Present';
                
                \Log::info('Scan time check:', [
                    'schedule_start' => $schedule->time,
                    'scan_time' => $now->format('H:i:s'),
                    'minutes_late' => $minutesLate,
                    'is_late' => $isLate,
                ]);

                // Update schedule to Present or Late
                $schedule->status     = $scheduleStatus;
                $schedule->attendance = 'Attended';
                $schedule->scanned_at = $now;
                $schedule->save();
                \Log::info('Schedule updated to ' . $scheduleStatus . '. ID: ' . $schedule->id);

                // Insert attendance log with correct status
                \App\Models\AttendanceLogs::create([
                    'instructor_id' => $user->instructor_id,
                    'schedule_id'   => $schedule->id,
                    'room'          => $schedule->room          ?? null,
                    'time_in'       => $now->format('H:i:s'),
                    'time_out'      => $schedule->end_time      ?? null,
                    'date'          => $now->format('Y-m-d'),
                    'status'        => $attendanceStatus,
                    'day'           => $schedule->day,
                    'subject'       => $schedule->subject       ?? null,
                    'code'          => $schedule->subject_code  ?? null,
                ]);
                \Log::info('✅ Attendance log inserted (' . $attendanceStatus . ')');

                // Activity log
                \App\Models\ActivityModel::create([
                    'name'          => $user->name,
                    'type'          => 'scan',
                    'instructor_id' => $user->instructor_id,
                    'device_id'     => $device->id,
                    'subject'       => $schedule->subject,
                    'scan_schedule' => $schedule->id,
                    'success'       => '1',
                ]);

                // ── Emit activity update to Socket.io ────────────
                (new SocketService())->emitActivityUpdate([
                    'id'           => time(),
                    'name'         => $user->name,
                    'type'         => 'scan',
                    'instructor_id'=> $user->instructor_id,
                    'subject'      => $schedule->subject,
                    'description'  => 'Scanned in for ' . $schedule->subject . ($isLate ? ' (Late: ' . $minutesLate . ' mins)' : ''),
                    'created_at'   => $now->toISOString(),
                ]);

                // ── Emit scan event to Socket.io ──────────────────
                (new SocketService())->emitScan([
                    'instructor_id' => $user->instructor_id,
                    'name'          => $user->name,
                    'department'    => $user->department ?? null,
                    'subject'       => $schedule->subject,
                    'room'          => $schedule->room ?? null,
                    'device_id'     => $device->id,
                    'device_name'   => $device->name,
                    'status'        => $scheduleStatus,
                    'scanned_at'    => $now->toISOString(),
                    'schedule_id'   => $schedule->id,
                ]);

                $actionMessage = $isLate ? 'LATE' : 'PRESENT';
                $responseData['message'] = 'Attendance recorded as ' . $attendanceStatus . ($isLate ? ' (' . $minutesLate . ' mins after start)' : '');
                $responseData['action']  = $actionMessage;
                $responseData['status']  = $attendanceStatus;
                $responseData['subject'] = $schedule->subject;
                $responseData['time']    = $schedule->time;
                $responseData['day']     = $schedule->day;
                $responseData['room']    = $schedule->room ?? 'N/A';
                if ($isLate) {
                    $responseData['late_minutes'] = $minutesLate;
                }

            } else {
                // No ongoing schedule — activity only
                \App\Models\ActivityModel::create([
                    'name'          => $user->name,
                    'type'          => 'scan',
                    'instructor_id' => $user->instructor_id,
                    'device_id'     => $device->id,
                    'success'       => '1',
                ]);

                // ── Emit activity update (no schedule) ───────────
                (new SocketService())->emitActivityUpdate([
                    'id'           => time(),
                    'name'         => $user->name,
                    'type'         => 'scan',
                    'instructor_id'=> $user->instructor_id,
                    'subject'      => null,
                    'description'  => 'Attendance scan (no active schedule)',
                    'created_at'   => $now->toISOString(),
                ]);

                // ── Emit scan event (no schedule) ─────────────────
                (new SocketService())->emitScan([
                    'instructor_id' => $user->instructor_id,
                    'name'          => $user->name,
                    'department'    => $user->department ?? null,
                    'device_id'     => $device->id,
                    'device_name'   => $device->name,
                    'status'        => 'scanned',
                    'scanned_at'    => $now->toISOString(),
                    'schedule_id'   => null,
                ]);

                $responseData['message'] = 'Scan recorded (no ongoing schedule)';
                $responseData['action']  = 'SCANNED';
                $responseData['hint']    = 'No schedule with Ongoing status found';
            }

            \Log::info('==== SCAN REQUEST END ====');
            return response()->json($responseData);

        } catch (\Exception $e) {
            \Log::error('Scan error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
    
    public function markAbsent(Request $request){
         DB::table('attendance_logs_db')->insert([
            'instructor_id' => $request->instructor_id,
            'schedule_id'   => $request->schedule_id,
            'room'          => $request->room     ?? null,
            'subject'       => $request->subject  ?? null,
            'code'          => $request->code     ?? null,
            'day'           => $request->day      ?? null,
            'time_in'       => null,
            'time_out'      => $request->time_out ?? null,
            'date'          => now()->format('Y-m-d'),
            'status'        => 'Absent',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
    }
}