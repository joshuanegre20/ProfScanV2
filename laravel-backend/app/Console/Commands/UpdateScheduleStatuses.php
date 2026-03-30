<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Services\SocketService;

class UpdateScheduleStatuses extends Command
{
    protected $signature   = 'schedules:update-statuses';
    protected $description = 'Set Ongoing when class starts, mark Absent 15 min after start if not scanned';

    public function handle()
    {
        $now     = now();
        $nowTime = $now->format('H:i:s');
        $today   = $now->format('Y-m-d');
        $socket  = new SocketService();

        $dayOfWeek = $now->dayOfWeek;
        $dayCode   = match($dayOfWeek) {
            1, 3, 5 => 'MWF',
            2, 4    => 'TTH',
            6       => 'SAT',
            0       => 'SUN',
            default => null,
        };

        if (!$dayCode) {
            $this->info("No schedules today.");
            return 0;
        }

        // ── 1. Set Upcoming → Ongoing ─────────────────────────────
        $ongoing = DB::table('schedule')
            ->whereIn('day', [$dayCode, 'SAT-SUN'])
            ->where('status', 'Upcoming')
            ->whereRaw('time <= ?', [$nowTime])
            ->whereRaw('(end_time IS NULL OR end_time > ?)', [$nowTime])
            ->update(['status' => 'Ongoing', 'updated_at' => now()]);

        if ($ongoing > 0) {
            $socket->emitScheduleUpdate([
                'type'   => 'ongoing',
                'count'  => $ongoing,
                'day'    => $dayCode,
                'time'   => $nowTime,
            ]);
        }

        // ── 2. Insert attendance log for newly Ongoing schedules ──
        $newlyOngoing = DB::table('schedule')
            ->whereIn('day', [$dayCode, 'SAT-SUN'])
            ->where('status', 'Ongoing')
            ->whereRaw('time <= ?', [$nowTime])
            ->get();

        foreach ($newlyOngoing as $schedule) {
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
        }

        // ── 3. Mark Absent after 15min grace period ───────────────
        $gracePeriod = $now->copy()->subMinutes(15)->format('H:i:s');

        $absent = DB::table('schedule')
            ->whereIn('day', [$dayCode, 'SAT-SUN'])
            ->where('status', 'Ongoing')
            ->whereRaw('time <= ?', [$gracePeriod])
            ->whereRaw('(end_time IS NULL OR end_time > ?)', [$nowTime])
            ->update([
                'status'     => 'Absent',
                'attendance' => 'Absent',
                'updated_at' => now(),
            ]);

        if ($absent > 0) {
            $socket->emitAttendanceUpdate([
                'type'  => 'auto_absent',
                'count' => $absent,
                'day'   => $dayCode,
                'time'  => $nowTime,
            ]);
        }

        DB::table('schedule')
            ->whereIn('day', [$dayCode, 'SAT-SUN'])
            ->where('status', 'Absent')
            ->whereRaw('time <= ?', [$gracePeriod])
            ->whereRaw('(end_time IS NULL OR end_time > ?)', [$nowTime])
            ->get()
            ->each(function ($schedule) use ($today) {
                DB::table('attendance_logs_db')
                    ->where('instructor_id', $schedule->instructor_id)
                    ->where('schedule_id',   $schedule->id)
                    ->where('date',          $today)
                    ->where('status', 'Absent')
                    ->update(['updated_at' => now()]);
            });

        $this->info("✅ Set Ongoing: {$ongoing} | Marked Absent (15min grace): {$absent}");
        \Log::info("schedules:update-statuses — Ongoing:{$ongoing} Absent:{$absent} at {$nowTime}");

        return 0;
    }
}