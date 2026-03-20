<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Services;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function __construct(protected Services $services) {}

    // GET /api/staff
    public function index(Request $request)
    {
        $staff = $this->services->getAllStaff($request->only(['search']));
        return response()->json($staff);
    }

    // POST /api/staff
    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'required|string|min:6|confirmed',
            'contact_no' => 'nullable|string|max:20',
            'address'    => 'nullable|string',
            'age'        => 'nullable|integer',
            'gender'     => 'nullable|in:Male,Female',
            'birth_date' => 'nullable|date',
            'photo'      => 'nullable|image|max:2048',
        ]);

        $data             = $request->except(['photo', '_method']);
        $data['staff_id'] = 'STF-' . strtoupper(uniqid());

        $staff = $this->services->createStaff($data, $request->file('photo'));

        return response()->json($staff, 201);
    }

    // DELETE /api/staff/{id}
    public function destroy(int $id)
    {
        $this->services->deleteStaff($id);
        return response()->json(['message' => 'Staff removed']);
    }

    // PATCH /api/staff/{id}/status
    public function updateStatus(Request $request, int $id)
    {
        $request->validate(['status' => 'required|in:Active,Inactive']);
        $staff = $this->services->updateStaffStatus($id, $request->status);
        return response()->json($staff);
    }

    // GET /api/staff/{id}/photo
    public function photo(int $id)
    {
        $user = User::where('role', 'staff')->findOrFail($id);

        if (!$user->profile_url) {
            return response()->json(['error' => 'No photo'], 404);
        }

        $path = storage_path('app/private/' . $user->profile_url);
        if (!file_exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return response()->file($path);
    }
}