<?php
// app/Models/LoginImage.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginImage extends Model
{
    protected $table = 'login_images';
    
    protected $fillable = [
        'image_path', 
        'description', 
        'is_active'
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
    ];
}