<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleModel extends Model
{
    //

    protected $table = 'schedule';

    protected $fillable =[

    'instructor_id',
    'name',
    'subject',
    'time',
    'end_time',
    'day', 
    'status',
    'subject_code'

    ];
}
