<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::command('schedules:reset')->dailyAt('00:00');
Schedule::command('schedules:update-statuses')->everyMinute();
Schedule::command('devices:update-statuses')->everyFiveSeconds();
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
