<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceLogs extends Model
{
    //

    protected $table = 'attendance_logs_db';

    protected $fillable = [
    'room',
    'instructor_id',
    'schedule_id',
    'time_in',
    'time_out',
    'date',
    'status',
    'day',
    'created_at',
    'subject',
    'code',
    'schedule_id'
];
}
