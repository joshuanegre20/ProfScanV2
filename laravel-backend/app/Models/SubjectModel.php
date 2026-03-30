<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubjectModel extends Model
{
    //
    protected $table = 'subject';

    protected $fillable =[
    'subject_code',
    'subject',
    'department'
    ];
     public function schedules()
    {
        return $this->hasMany(\App\Models\ScheduleModel::class, 'subject_code', 'subject_code');
    }
}
