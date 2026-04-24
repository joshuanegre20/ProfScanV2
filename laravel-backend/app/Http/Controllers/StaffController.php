<?php

namespace App\Http\Controllers;

use App\Services\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StaffController extends Controller
{
    protected $services;

    public function __construct(Services $services)
    {
        $this->services = $services;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['search']);
        $staff = $this->services->getAllStaff($filters);
        
        return response()->json($staff->map(function ($staff) {
            return [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'contact_no' => $staff->contact_no,
                'status' => $staff->status,
                'profile_url' => $staff->profile_url ? url("/api/staff/{$staff->id}/photo") : null,
                'staff_id' => $staff->staff_id,
                'address' => $staff->address,
                'gender' => $staff->gender,
                'age' => $staff->age,
                'birth_date' => $staff->birth_date,
            ];
        }));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'staff_id'      => 'required|string|unique:users,staff_id',
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users',
            'password'      => 'required|min:8|confirmed',
            'contact_no'    => 'nullable|string|max:20',
            'address'       => 'nullable|string',
            'gender'        => 'nullable|string',
            'age'           => 'nullable|integer',
            'photo'         => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $staff = $this->services->createStaff($data, $request->file('photo'));
        return response()->json($staff, 201);
    }

    // ADD THIS UPDATE METHOD
    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'email'         => 'sometimes|email|unique:users,email,' . $id,
            'contact_no'    => 'nullable|string|max:20',
            'address'       => 'nullable|string',
            'gender'        => 'nullable|string',
            'age'           => 'nullable|integer',
            'photo'         => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $staff = $this->services->updateStaff($id, $data, $request->file('photo'));
        return response()->json($staff);
    }

    public function destroy(int $id)
    {
        $this->services->deleteStaff($id);
        return response()->json(['message' => 'Staff deleted successfully']);
    }

    public function updateStatus(Request $request, int $id)
    {
        $request->validate(['status' => 'required|in:Active,Inactive']);
        $staff = $this->services->updateStaffStatus($id, $request->status);
        return response()->json($staff);
    }

    public function photo(int $id)
    {
        $staff = $this->services->findStaffById($id);
        
        if (!$staff->profile_url) {
            abort(404);
        }

        $path = ltrim($staff->profile_url, '/');

        if (!Storage::disk('private')->exists($path)) {
            abort(404);
        }

        return response()->stream(function () use ($path) {
            echo Storage::disk('private')->get($path);
        }, 200, [
            'Content-Type' => Storage::disk('private')->mimeType($path),
            'Cache-Control' => 'no-store',
        ]);
    }
}