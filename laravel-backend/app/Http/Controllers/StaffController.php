<?php

namespace App\Http\Controllers;

use App\Services\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule; // Add this for validation

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
                'id'          => $staff->id,
                'name'        => $staff->name,
                'email'       => $staff->email,
                'contact_no'  => $staff->contact_no,
                'status'      => $staff->status,
                'profile_url' => $staff->profile_url ? url("/api/staff/{$staff->id}/photo") : null,
                'staff_id'    => $staff->staff_id,
                'address'     => $staff->address,
                'gender'      => $staff->gender,
                'age'         => $staff->age,
                'birth_date'  => $staff->birth_date,
            ];
        }));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'staff_id'   => 'required|string|unique:users,staff_id',
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|min:8|confirmed',
            'contact_no' => 'nullable|string|max:20',
            'address'    => 'nullable|string',
            'gender'     => 'nullable|string',
            'age'        => 'nullable|integer',
            'photo'      => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $staff = $this->services->createStaff($data, $request->file('photo'));
        return response()->json($staff, 201);
    }

    // FIX: Use string for route parameter (Laravel passes IDs as strings)
    public function update(Request $request, string $id)
    {
        $id = (int) $id; // Convert to integer for service layer
        
        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'email'      => [
                'sometimes',
                'email',
                Rule::unique('users', 'email')->ignore($id), // IMPORTANT: Ignore current user
            ],
            'contact_no' => 'nullable|string|max:20',
            'address'    => 'nullable|string',
            'gender'     => 'nullable|string',
            'age'        => 'nullable|integer',
            'photo'      => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $staff = $this->services->updateStaff($id, $data, $request->file('photo'));
        return response()->json($staff);
    }

    // Add dedicated profile update method for the authenticated user
    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        
        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'email'      => [
                'sometimes',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'contact_no' => 'nullable|string|max:20',
            'address'    => 'nullable|string',
            'gender'     => 'nullable|string',
        ]);

        $user->update($data);
        
        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user
        ]);
    }

    public function destroy(string $id)
    {
        $id = (int) $id;
        $this->services->deleteStaff($id);
        return response()->json(['message' => 'Staff deleted successfully']);
    }

    public function updateStatus(Request $request, string $id)
    {
        $id = (int) $id;
        $request->validate(['status' => 'required|in:Active,Inactive']);
        $staff = $this->services->updateStaffStatus($id, $request->status);
        return response()->json($staff);
    }

  public function photo(string $id)
{
    try {
        $id = (int) $id;

        // Bypass service layer — direct model lookup
        $staff = \App\Models\User::find($id);

        if (!$staff || !$staff->profile_url) {
            abort(404);
        }

        $path = $staff->profile_url;

        if (!Storage::disk('private')->exists($path)) {
            \Log::error("Staff photo not found. ID: {$id}, path: {$path}");
            abort(404);
        }

        return response()->stream(function () use ($path) {
            echo Storage::disk('private')->get($path);
        }, 200, [
            'Content-Type'  => Storage::disk('private')->mimeType($path),
            'Cache-Control' => 'no-store',
        ]);

    } catch (\Exception $e) {
        \Log::error('Staff photo error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
        abort(500);
    }
}

    public function uploadAvatar(Request $request)
{
    $request->validate([
        'photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048'
    ]);

    $user = auth()->user();

    if ($user->profile_url) {
        Storage::disk('private')->delete($user->profile_url);
    }

    // ✅ Changed from 'photos/staff' → 'staff' to match existing files
    $path = $request->file('photo')->store('staff', 'private');
    $user->update(['profile_url' => $path]);

    return response()->json(['message' => 'Photo updated successfully']);
}
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password'      => 'required',
            'new_password'          => 'required|min:8|confirmed',
        ]);

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password changed successfully!'
        ]);
    }

    public function findStaffById(string $id)
    {
        $id = (int) $id;
        return $this->services->findStaffById($id);
    }
}