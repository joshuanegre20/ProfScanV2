<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Carousel extends Model
{
    protected $table = 'carousel';
    
    protected $fillable = ['image_path', 'description', 'is_active', 'created_at', 'updated_at'];
    
    protected $casts = [
        'is_active' => 'boolean',
    ];
    
    // Accessor to get full URL for image
    public function getImageUrlAttribute()
    {
        return asset('storage/' . $this->image_path);
    }
}