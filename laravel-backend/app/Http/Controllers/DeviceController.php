<?php

// ── app/Http/Controllers/DeviceController.php ─────────────────────

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\User;
use App\Models\ScheduleModel;
use App\Models\ActivityModel;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use App\Models\AttendanceLogs;

class DeviceController extends Controller
{

public function heartbeat(Request $request)
{
    try {
        $request->validate([
            'pairing_token' => 'required|string'
        ]);

        $device = Device::where('pairing_token', $request->pairing_token)
            ->where('paired', true)
            ->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found'
            ], 404);
        }

        $device->last_seen = now();
        $device->status = 'online';
        $device->save();

        return response()->json([
            'success' => true,
            'message' => 'Heartbeat received'
        ]);

    } catch (\Exception $e) {
        \Log::error('Heartbeat error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Server error'
        ], 500);
    }
}
    // ── GET /api/devices ─────────────────────────────────────────
    public function index()
    {
        // Mark devices offline if no heartbeat in last 35 seconds
        Device::where('status', 'online')
            ->where('last_seen', '<', now()->subSeconds(35))
            ->update(['status' => 'offline']);
     
        return response()->json(Device::orderByDesc('created_at')->get());
    }

    // ── POST /api/devices ────────────────────────────────────────
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

    // ── PUT /api/devices/{id} ────────────────────────────────────
    public function update(Request $request, $id)
    {
        $device = Device::findOrFail($id);

        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'wifi_ssid'     => 'sometimes|string|max:100',
            'wifi_password' => 'sometimes|string|max:100',
            'server_url'    => 'sometimes|string|max:255',
            'scan_cooldown' => 'sometimes|integer|min:1000|max:10000',
        ]);

        $device->update($data);

        return response()->json($device);
    }

    // ── DELETE /api/devices/{id} ─────────────────────────────────
    public function destroy($id)
    {
        Device::findOrFail($id)->delete();

        return response()->json(['message' => 'Device removed']);
    }

    // ── POST /api/devices/register ───────────────────────────────
    public function register(Request $request)
    {
        $data = $request->validate([
            'pairing_token' => 'required|string',
            'chip_id'       => 'required|string',
            'mac_address'   => 'required|string',
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

        return response()->json([
            'message' => 'Device paired successfully',
            'device'  => $device,
        ], 201);
    }



public function scan(Request $request)
{
    try {
        \Log::info('==== SCAN REQUEST START ====');
        \Log::info('Request data:', $request->all());

        $instructor_id = $request->input('employee_id') ?? $request->input('instructor_id');
        $pairing_token = $request->input('pairing_token');

        if (!$instructor_id) {
            return response()->json([
                'success' => false,
                'message' => 'Instructor ID is required'
            ], 422);
        }

        if (!$pairing_token) {
            return response()->json([
                'success' => false,
                'message' => 'Pairing token is required'
            ], 422);
        }

        // Find the device
        $device = \App\Models\Device::where('pairing_token', $pairing_token)
            ->where('paired', true)
            ->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found or not paired'
            ], 404);
        }
        \Log::info('Device found:', ['device_id' => $device->id]);

        // Find the user
        $user = \App\Models\User::where('instructor_id', $instructor_id)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found with Instructor ID: ' . $instructor_id
            ], 404);
        }

        \Log::info('User found:', [
            'user_id' => $user->id,
            'name'    => $user->name,
            'role'    => $user->role
        ]);

        $now = now();

        // Find ongoing schedule
        $schedule = null;

        if ($user->role === 'instructor') {
            \Log::info('Looking for schedule with status = Ongoing for instructor: ' . $user->instructor_id);

            $schedule = \App\Models\ScheduleModel::where('instructor_id', $user->instructor_id)
                ->where('status', 'Ongoing')
                ->first();

            if ($schedule) {
                \Log::info('✅ Found ongoing schedule:', [
                    'schedule_id' => $schedule->id,
                    'subject'     => $schedule->subject,
                    'time'        => $schedule->time,
                    'day'         => $schedule->day
                ]);
            } else {
                \Log::info('❌ No ongoing schedule found for this instructor');

                $totalSchedules = \App\Models\ScheduleModel::where('instructor_id', $user->instructor_id)->count();
                if ($totalSchedules > 0) {
                    $otherStatuses = \App\Models\ScheduleModel::where('instructor_id', $user->instructor_id)
                        ->distinct('status')
                        ->pluck('status');
                    \Log::info('Schedules exist but with statuses: ' . $otherStatuses->implode(', '));
                } else {
                    \Log::info('No schedules at all for this instructor');
                }
            }
        }

        // Update user scan status
        $user->scan_status     = 'scanned';
        $user->last_scanned_at = $now;
        $user->save();
        \Log::info('User scan status updated');

        // Update device
        $device->last_seen = $now;
        $device->status    = 'online';
        $device->save();
        \Log::info('Device status updated');

        $responseData = [
            'success'   => true,
            'name'      => $user->name,
            'scan_time' => $now->format('Y-m-d H:i:s')
        ];

        if ($schedule) {
            // Update schedule status
            $schedule->status     = 'Present';
            $schedule->attendance = 'Present';
            $schedule->scanned_at = $now;
            $schedule->save();
            \Log::info('Schedule updated to Present. ID: ' . $schedule->id);

            // ✅ Insert into attendance_logs_db ONLY when schedule is Ongoing
            \App\Models\AttendanceLogs::create([
                'instructor_id' => $user->instructor_id,
                'room'          => $schedule->room ?? null,
                'time_in'       => $now->format('H:i:s'),
                'time_out'      => $schedule->end_time ?? null,
                'date'          => $now->format('Y-m-d'),
                'status'        => 'Present',
                'day'           => $schedule->day,
                'subject'       => $schedule->subject ?? null,
                'code'          => $schedule->subject_code ?? null,
                'created_at'    => $now,
            ]);
            \Log::info('✅ Attendance log inserted (Present)');

            // Create activity with schedule
            \App\Models\ActivityModel::create([
                'name'          => $user->name,
                'type'          => 'scan',
                'instructor_id' => $user->instructor_id,
                'device_id'     => $device->id,
                'subject'       => $schedule->subject,
                'scan_schedule' => $schedule->id,
                'success'       => '1'
            ]);

            $responseData['message'] = 'Attendance recorded as Present';
            $responseData['action']  = 'PRESENT';
            $responseData['subject'] = $schedule->subject;
            $responseData['time']    = $schedule->time;
            $responseData['day']     = $schedule->day;
            $responseData['room']    = $schedule->room ?? 'N/A';

        } else {
            // ✅ No ongoing schedule — insert activity ONLY, skip attendance_logs_db
            \Log::info('No ongoing schedule — inserting activity only');

            \App\Models\ActivityModel::create([
                'name'          => $user->name,
                'type'          => 'scan',
                'instructor_id' => $user->instructor_id,
                'device_id'     => $device->id,
                'success'       => '1'
            ]);

            $responseData['message'] = 'Scan recorded (no ongoing schedule)';
            $responseData['action']  = 'SCANNED';
            $responseData['hint']    = 'No schedule with Ongoing status found';
        }

        \Log::info('Scan completed successfully');
        \Log::info('==== SCAN REQUEST END ====');

        return response()->json($responseData);

    } catch (\Exception $e) {
        \Log::error('Scan error: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());

        return response()->json([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage()
        ], 500);
    }
}
}