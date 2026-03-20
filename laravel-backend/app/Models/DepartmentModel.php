<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepartmentModel extends Model
{
    //

    protected $table = "departments";

    protected $fillable =[

    'degree_program',
    'college'
    ];
}
