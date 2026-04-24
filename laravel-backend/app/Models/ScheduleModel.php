<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleModel extends Model
{
    //

    protected $table = 'schedule';
      public $timestamps = false; 

    protected $fillable =[

    'instructor_id',
    'name',
    'subject',
    'time',
    'end_time',
    'day', 
    'status',
    'subject_code',
    'device_id',
    'room',
    'attendance',
    'scanned_at',
    'block'

    ];
}
