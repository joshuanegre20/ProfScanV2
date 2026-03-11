<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class InstructorController extends Controller
{
    public function __construct(
        protected Services $services
    ) {}

    public function index(Request $request)
{
    $instructors = $this->services->getAll($request->only(['search', 'department']));

    return response()->json($instructors->map(function ($instructor) {
        // Only return photo URL if path starts with instructors/ (valid path)
        $hasValidPhoto = $instructor->profile_url 
            && str_starts_with($instructor->profile_url, 'instructors/');

        return [
            'id'             => $instructor->id,
            'name'           => $instructor->name,
            'email'          => $instructor->email,
            'role'           => $instructor->role,
            'status'         => $instructor->status,
            'instructor_id'  => $instructor->instructor_id,
            'department'     => $instructor->department,
            'specialization' => $instructor->specialization,
            'join_date'      => $instructor->hire_date,
            'profile_url'    => $hasValidPhoto
                                    ? url("/api/admin/instructors/{$instructor->id}/photo")
                                    : null,
        ];
    }));
}

    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id'       => 'required|string|unique:users,instructor_id',
            'name'              => 'required|string|max:255',
            'email'             => 'required|email|unique:users',
            'password'          => 'required|min:8|confirmed',
            'department'        => 'required|string',
            'specialization'    => 'required|string',
            'contact_no'        => 'required|string',
            'age'               => 'required|integer',
            'gender'            => 'required|string',
            'birth_date'        => 'required|date',
            'address'           => 'required|string',
            'photo'             => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'qr_payload'        => 'nullable|string',
        ]);

        $data['instructor_id'] = $data['employee_id'];
        unset($data['employee_id']);

        $instructor = $this->services->create($data, $request->file('photo'));
        return response()->json($instructor, 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'email'          => 'sometimes|email|unique:users,email,' . $id,
            'password'       => 'nullable|min:8|confirmed',
            'department'     => 'sometimes|string',
            'specialization' => 'sometimes|string',
            'photo'          => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $instructor = $this->services->update($id, $data, $request->file('photo'));
        return response()->json($instructor);
    }

    public function destroy(int $id)
    {
        $this->services->delete($id);
        return response()->json(['message' => 'Instructor deleted successfully']);
    }

    public function updateStatus(Request $request, int $id)
    {
        $request->validate(['status' => 'required|in:Active,Inactive']);
        $instructor = $this->services->updateStatus($id, $request->status);
        return response()->json($instructor);
    }

    public function photo(int $id)
    {
        $instructor = $this->services->findById($id);

        if (!$instructor->profile_url) {
            abort(404);
        }

        $path = ltrim($instructor->profile_url, '/');

        if (!Storage::disk('private')->exists($path)) {
            abort(404);
        }

        return response()->stream(function () use ($path) {
            echo Storage::disk('private')->get($path);
        }, 200, [
            'Content-Type'  => Storage::disk('private')->mimeType($path),
            'Cache-Control' => 'no-store',
        ]);
    }
}