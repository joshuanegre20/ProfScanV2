<?php

namespace App\Http\Controllers;

use App\Services\Services;
use App\Services\SocketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleController extends Controller
{
    public function __construct(
        protected Services $services,
        protected SocketService $socket
    ) {}

    public function index(Request $request)
    {
        $schedules = $this->services->getSchedules(
            $request->only(['search', 'day', 'status', 'instructor_id'])
        );
        return response()->json($schedules);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'instructor_id' => 'required|string',
            'name'          => 'required|string|max:255',
            'subject'       => 'required|string|max:255',
            'subject_code'  => 'required|string|max:50',
            'time'          => 'required|string',
            'end_time'      => 'nullable|string',
            'day'           => 'required|in:MWF,TTH,SAT,SUN,SAT-SUN',
            'status'        => 'required|in:Upcoming,Ongoing,Present,Absent,Attended,Excused',
            'room'          => 'nullable|string|max:100',
            'device_id'     => 'nullable|exists:devices,id',
            'block'         => 'required|string',
        ]);

        $schedule = $this->services->addSchedule($data);

        $this->socket->emitScheduleUpdate([
            'schedule_id'   => $schedule->id,
            'status'        => $schedule->status,
            'instructor_id' => $schedule->instructor_id,
            'subject'       => $schedule->subject,
            'action'        => 'created',
        ]);

        return response()->json($schedule, 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'instructor_id' => 'sometimes|string',
            'name'          => 'sometimes|string|max:255',
            'subject'       => 'sometimes|string|max:255',
            'subject_code'  => 'sometimes|string|max:50',
            'time'          => 'sometimes|string',
            'end_time'      => 'nullable|string',
            'day'           => 'sometimes|in:MWF,TTH,SAT,SUN,SAT-SUN',
            'status'        => 'sometimes|in:Upcoming,Ongoing,Present,Absent,Attended,Excused',
            'room'          => 'nullable|string|max:100',
            'device_id'     => 'nullable|exists:devices,id',
        ]);

        $schedule = $this->services->updateSchedule($id, $data);

        $this->socket->emitScheduleUpdate([
            'schedule_id'   => $schedule->id,
            'status'        => $schedule->status,
            'instructor_id' => $schedule->instructor_id,
            'subject'       => $schedule->subject,
            'action'        => 'updated',
        ]);

        if (in_array($schedule->status, ['Present', 'Absent', 'Excused'])) {
            $this->socket->emitAttendanceUpdate([
                'type'          => 'status_changed',
                'schedule_id'   => $schedule->id,
                'instructor_id' => $schedule->instructor_id,
                'status'        => $schedule->status,
                'date'          => $this->nowPH()->format('Y-m-d'),
            ]);
        }

        return response()->json($schedule);
    }

    public function destroy(int $id)
    {
        $this->services->deleteSchedule($id);
        return response()->json(['message' => 'Schedule deleted successfully']);
    }

  public function setOngoing(Request $request)
{
    try {
        $request->validate([
            'schedule_id' => 'required|integer|exists:schedule,id',
        ]);

        $nowPH    = $this->nowPH();
        $today    = $nowPH->format('Y-m-d');
        $currentTime = $nowPH->format('H:i:s');
        
        $schedule = DB::table('schedule')->where('id', $request->schedule_id)->first();

        if (!$schedule) {
            return response()->json([
                'success' => false,
                'message' => 'Schedule not found with ID: ' . $request->schedule_id,
            ], 404);
        }

        // Determine the correct status based on current time
        $newStatus = 'Ongoing';
        
        // If current time is past end_time, mark as Absent
        if ($schedule->end_time && $currentTime > $schedule->end_time) {
            $newStatus = 'Absent';
        }
        // If time hasn't started yet, keep as Upcoming
        else if ($schedule->time && $currentTime < $schedule->time) {
            $newStatus = 'Upcoming';
        }
        // If time is within range, mark as Ongoing
        else {
            $newStatus = 'Ongoing';
        }

        DB::table('schedule')
            ->where('id', $schedule->id)
            ->update([
                'status' => $newStatus, 
                'updated_at' => $nowPH
            ]);

        $this->socket->emitScheduleUpdate([
            'schedule_id'   => $schedule->id,
            'status'        => $newStatus,
            'instructor_id' => $schedule->instructor_id,
            'subject'       => $schedule->subject,
            'action'        => 'status_changed',
        ]);

        // Only create absent record if the schedule is actually Absent (time has passed)
        if ($newStatus === 'Absent') {
            $alreadyLogged = DB::table('attendance_logs_db')
                ->where('instructor_id', $schedule->instructor_id)
                ->where('schedule_id',   $schedule->id)
                ->where('date',          $today)
                ->exists();

            if (!$alreadyLogged) {
                DB::table('attendance_logs_db')->insert([
                    'instructor_id' => $schedule->instructor_id,
                    'schedule_id'   => $schedule->id,
                    'room'          => $schedule->room         ?? null,
                    'subject'       => $schedule->subject      ?? null,
                    'code'          => $schedule->subject_code ?? null,
                    'day'           => $schedule->day          ?? null,
                    'time_in'       => null,
                    'time_out'      => $schedule->end_time     ?? null,
                    'date'          => $today,
                    'status'        => 'Absent',
                    'created_at'    => $nowPH,
                    'updated_at'    => $nowPH,
                ]);

                $this->socket->emitAttendanceUpdate([
                    'type'          => 'auto_absent',
                    'schedule_id'   => $schedule->id,
                    'instructor_id' => $schedule->instructor_id,
                    'status'        => 'Absent',
                    'date'          => $today,
                ]);
            }
        }

        return response()->json([
            'success'     => true,
            'message'     => "Schedule status set to {$newStatus}",
            'schedule_id' => $schedule->id,
            'status'      => $newStatus,
        ]);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors'  => $e->errors(),
        ], 422);
    } catch (\Exception $e) {
        \Log::error('setOngoing error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage(),
        ], 500);
    }
}

    public function excuseAllToday(Request $request)
    {
        try {
            $request->validate([
                'device_id' => 'required|integer|exists:devices,id',
                'event_id'  => 'nullable|integer',
                'reason'    => 'nullable|string|max:255',
                'day_group' => 'nullable|string|in:MWF,TTH,SAT,SUN,SAT-SUN',
            ]);

            $nowPH  = $this->nowPH();
            $today  = $nowPH->format('Y-m-d');

            // Get today's group from frontend or calculate server-side
            $todayGroup = $request->filled('day_group')
                ? $request->day_group
                : $this->getTodayGroup();

            \Log::info('excuseAllToday', [
                'device_id'  => $request->device_id,
                'todayGroup' => $todayGroup,
                'today'      => $today,
                'nowPH'      => $nowPH->format('Y-m-d H:i:s'),
                'source'     => $request->filled('day_group') ? 'frontend' : 'server',
            ]);

            if (!$todayGroup) {
                return response()->json([
                    'success' => false,
                    'message' => 'No schedule group for today.',
                ], 400);
            }

            // Get schedules that are NOT already Present/Attended
            $schedulesToExcuse = DB::table('schedule')
                ->where('device_id', $request->device_id)
                ->where('day', $todayGroup)
                ->whereNotIn('status', ['Present', 'Attended'])
                ->get();

            \Log::info('Schedules to excuse', [
                'count' => $schedulesToExcuse->count(),
                'schedules' => $schedulesToExcuse->map(function($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'status' => $s->status,
                    ];
                })->toArray()
            ]);

            if ($schedulesToExcuse->isEmpty()) {
                $todaySchedulesCount = DB::table('schedule')
                    ->where('device_id', $request->device_id)
                    ->where('day', $todayGroup)
                    ->count();

                $presentCount = DB::table('schedule')
                    ->where('device_id', $request->device_id)
                    ->where('day', $todayGroup)
                    ->whereIn('status', ['Present', 'Attended'])
                    ->count();

                return response()->json([
                    'success' => true,
                    'message' => "No schedules to excuse for today ({$todayGroup}). " .
                                 "{$presentCount} schedule(s) already marked Present/Attended.",
                    'excused' => 0,
                ]);
            }

            $excusedCount = 0;
            $reason       = $request->reason ?? 'Event';

            foreach ($schedulesToExcuse as $schedule) {
                // Update schedule to Excused
                DB::table('schedule')
                    ->where('id', $schedule->id)
                    ->update([
                        'status'     => 'Excused',
                        'updated_at' => $nowPH,
                    ]);

                // Check if attendance log exists
                $existingLog = DB::table('attendance_logs_db')
                    ->where('instructor_id', $schedule->instructor_id)
                    ->where('schedule_id',   $schedule->id)
                    ->where('date',          $today)
                    ->first();

                if ($existingLog) {
                    DB::table('attendance_logs_db')
                        ->where('id', $existingLog->id)
                        ->update([
                            'status'     => 'Excused',
                            'updated_at' => $nowPH,
                        ]);
                } else {
                    DB::table('attendance_logs_db')->insert([
                        'instructor_id' => $schedule->instructor_id,
                        'schedule_id'   => $schedule->id,
                        'room'          => $schedule->room         ?? null,
                        'subject'       => $schedule->subject      ?? null,
                        'code'          => $schedule->subject_code ?? null,
                        'day'           => $schedule->day          ?? null,
                        'time_in'       => null,
                        'time_out'      => $schedule->end_time     ?? null,
                        'date'          => $today,
                        'status'        => 'Excused',
                        'created_at'    => $nowPH,
                        'updated_at'    => $nowPH,
                    ]);
                }

                // Emit socket events
                $this->socket->emitScheduleUpdate([
                    'schedule_id'   => $schedule->id,
                    'status'        => 'Excused',
                    'instructor_id' => $schedule->instructor_id,
                    'subject'       => $schedule->subject,
                    'action'        => 'excused',
                ]);

                $this->socket->emitAttendanceUpdate([
                    'type'          => 'excused',
                    'schedule_id'   => $schedule->id,
                    'instructor_id' => $schedule->instructor_id,
                    'status'        => 'Excused',
                    'date'          => $today,
                ]);

                $excusedCount++;
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully excused {$excusedCount} schedule(s) for today ({$todayGroup}) due to: {$reason}",
                'excused' => $excusedCount,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('excuseAllToday error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getSchedulesForDevice(Request $request)
    {
        try {
            $deviceId  = $request->query('device_id');
            $query     = DB::table('schedule');
            if ($deviceId) $query->where('device_id', $deviceId);
            $schedules = $query->get();
            return response()->json([
                'success'   => true,
                'count'     => $schedules->count(),
                'schedules' => $schedules,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Returns current time in Asia/Manila timezone.
     * Use this everywhere instead of now() to avoid UTC day-boundary issues.
     */
    private function nowPH(): \Carbon\Carbon
    {
        return now()->setTimezone('Asia/Manila');
    }

    /**
     * Returns today's schedule day group in PH timezone.
     */
    private function getTodayGroup(): string
    {
        $day = $this->nowPH()->dayOfWeek; // 0 = Sun, 1 = Mon … 6 = Sat
        
        switch ($day) {
            case 1:
            case 3:
            case 5:
                return 'MWF';
            case 2:
            case 4:
                return 'TTH';
            case 6:
                return 'SAT';
            case 0:
                return 'SUN';
            default:
                return '';
        }
    }
}