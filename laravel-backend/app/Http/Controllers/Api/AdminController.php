<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage; 
use App\Models\User;

class AdminController extends Controller
{
    public function __construct(
        protected Services $services
    ) {}

 public function me(Request $request)
{
    $admin = $request->user();

    return response()->json([
        'name'        => $admin->name,
        'email'       => $admin->email,
        'role'        => $admin->role ?? 'Admin',
        'profile_url' => $admin->profile_url
                            ? url('/api/admin/photo')   
                            : null,
    ]);
}

public function updateAvatar(Request $request)
{
    $request->validate([
        'photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
    ]);

    $admin = $request->user();

    // Delete old photo manually since we can't use services->update()
    if ($admin->profile_url) {
        Storage::disk('private')->delete($admin->profile_url);
    }

    $path = $request->file('photo')->store('admins', 'private');

    $this->services->updateAdmin($admin->id, ['profile_url' => $path]);

    return response()->json([
        'message'     => 'Profile picture updated.',
        'profile_url' => url('/api/admin/photo'),
    ]);
}
public function photo(Request $request)
{
    $admin = $request->user();

    if (!$admin->profile_url || !Storage::disk('private')->exists($admin->profile_url)) {
        abort(404);
    }

    $file     = Storage::disk('private')->get($admin->profile_url);
    $mimeType = Storage::disk('private')->mimeType($admin->profile_url);

    return response($file, 200)->header('Content-Type', $mimeType);
}
public function updateProfile(Request $request)
{
    $request->validate([
        'name'  => 'required|string|max:255',
        'email' => 'required|email|unique:users,email,' . $request->user()->id,
    ]);

    $this->services->updateAdmin($request->user()->id, [
        'name'  => $request->name,
        'email' => $request->email,
    ]);

    return response()->json(['message' => 'Profile updated successfully.']);
}
public function recentScans()
{
    $scans = User::where('role', 'instructor')
        ->whereNotNull('last_scanned_at')
        ->orderBy('last_scanned_at', 'desc')
        ->limit(10)
        ->get(['name', 'instructor_id', 'department', 'scan_status', 'last_scanned_at']);

    return response()->json($scans);
}
}