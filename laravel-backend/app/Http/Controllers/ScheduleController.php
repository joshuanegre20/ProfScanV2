<?php

namespace App\Http\Controllers;

use App\Services\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleController extends Controller
{
    public function __construct(
        protected Services $services
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
        ]);

        $schedule = $this->services->addSchedule($data);
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
            $request->validate(['schedule_id' => 'required|integer']);

            $today    = now()->format('Y-m-d');
            $schedule = DB::table('schedule')->where('id', $request->schedule_id)->first();

            if (!$schedule) {
                return response()->json(['success' => false, 'message' => 'Schedule not found'], 404);
            }

            DB::statement('UPDATE `schedule` SET `status` = ? WHERE `id` = ?', ['Ongoing', $schedule->id]);

            $alreadyLogged = DB::table('attendance_logs_db')
                ->where('instructor_id', $schedule->instructor_id)
                ->where('schedule_id',   $schedule->id)
                ->where('date',          $today)
                ->exists();

            if (!$alreadyLogged) {
                DB::table('attendance_logs_db')->insert([
                    'instructor_id' => $schedule->instructor_id,
                    'schedule_id'   => $schedule->id,
                    'room'          => $schedule->room,
                    'subject'       => $schedule->subject,
                    'code'          => $schedule->subject_code,
                    'day'           => $schedule->day,
                    'time_in'       => null,
                    'time_out'      => $schedule->end_time,
                    'date'          => $today,
                    'status'        => 'Absent',
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }

            return response()->json(['success' => true, 'message' => 'Ongoing set and absent log inserted']);

        } catch (\Exception $e) {
            \Log::error('setOngoing error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function excuseAllToday(Request $request)
{
    try {
        $request->validate(['device_id' => 'required|integer']);

        $today   = now()->format('Y-m-d');
        $dayCode = match(now()->dayOfWeek) {
            1, 3, 5 => 'MWF',
            2, 4    => 'TTH',
            6       => 'SAT',
            0       => 'SUN',
            default => null
        };

        if (!$dayCode) {
            return response()->json(['success' => false, 'message' => 'No schedules today'], 400);
        }

        // Get today's schedules — not already Present/Attended/Excused
        $schedules = DB::table('schedule')
            ->where('device_id', $request->device_id)
            ->whereIn('day', [$dayCode, 'SAT-SUN'])
            ->whereNotIn('status', ['Present', 'Attended', 'Excused'])  // includes Absent, Upcoming, Ongoing
            ->get();

        if ($schedules->isEmpty()) {
            return response()->json(['success' => true, 'message' => 'No schedules to excuse', 'count' => 0]);
        }

        $excused = 0;

        foreach ($schedules as $schedule) {
            // Update schedule status to Excused
            DB::table('schedule')
                ->where('id', $schedule->id)
                ->update(['status' => 'Excused', 'updated_at' => now()]);

            // Upsert attendance log — update if exists, insert if not
            $alreadyLogged = DB::table('attendance_logs_db')
                ->where('instructor_id', $schedule->instructor_id)
                ->where('schedule_id',   $schedule->id)
                ->where('date',          $today)
                ->exists();

            if ($alreadyLogged) {
                DB::table('attendance_logs_db')
                    ->where('instructor_id', $schedule->instructor_id)
                    ->where('schedule_id',   $schedule->id)
                    ->where('date',          $today)
                    ->update(['status' => 'Excused', 'updated_at' => now()]);
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
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }
            $excused++;
        }

        return response()->json([
            'success' => true,
            'message' => "Excused {$excused} schedule(s) for today",
            'count'   => $excused,
        ]);

    } catch (\Exception $e) {
        \Log::error('excuseAllToday error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}
}