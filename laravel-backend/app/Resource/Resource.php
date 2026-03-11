<?php

namespace App\Http\Resource;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class Resource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'role'           => $this->role,
            'status'         => $this->status,
            'instructor_id'  => $this->instructor_id,
            'department'     => $this->department,
            'specialization' => $this->specialization,
            'join_date'      => $this->hire_date,
            'profile_url'    => $this->profile_url
                                    ? route('api.instructor.photo', ['id' => $this->id])
                                    : null,
            'created_at'     => $this->created_at->toDateString(),
        ];
    }
}