<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetScheduleStatuses extends Command
{
    protected $signature   = 'schedules:reset';
    protected $description = 'Reset all schedule statuses to Upcoming at midnight';

    public function handle()
    {
        $count = DB::table('schedule')
            ->whereIn('status', ['Ongoing', 'Absent', 'Attended', 'Excused', 'Present'])
            ->update([
                'status'     => 'Upcoming',
                'attendance' => 'Absent',
                'scanned_at' => null,
                'updated_at' => now(),
            ]);

        $this->info("✅ Reset {$count} schedule(s) to Upcoming.");
        \Log::info("schedules:reset — reset {$count} schedules at " . now());

        return 0;
    }
}