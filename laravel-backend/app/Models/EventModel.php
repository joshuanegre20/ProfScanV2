<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventModel extends Model
{
    //
    protected $table ='events';

    protected $fillable =[
    'title',
    'description',
    'date',
    'date_ends',
    'location',
    'type',
    'status',
    'start',
    'ends',
    ];
}
