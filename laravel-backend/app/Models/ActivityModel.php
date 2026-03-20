<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityModel extends Model
{
    protected $table = 'activities';
    
    protected $fillable = [
        'instructor_id',
        'staff_id',
        'name',
        'type',
        'college',
        'subject',
        'scanned_schedule',
        'device_id',
        'success'
        // REMOVED: 'description', 'user_id', 'success', 'message'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
}