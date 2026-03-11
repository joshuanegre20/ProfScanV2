<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ScanController extends Controller
{
    //

  public function store(Request $request)
{
    $request->validate(['employee_id' => 'required|string']);

    $instructor = \App\Models\User::where('instructor_id', $request->employee_id)
        ->where('role', 'instructor')
        ->first();

    if (!$instructor) {
        return response()->json(['success' => false, 'message' => 'Instructor not found'], 404);
    }

    $instructor->update([
        'scan_status'    => 'scanned',
        'last_scanned_at' => now(),
    ]);

    return response()->json([
        'success'        => true,
        'name'           => $instructor->name,
        'employee_id'    => $instructor->instructor_id,
        'scan_status'    => 'scanned',
        'last_scanned_at' => $instructor->last_scanned_at,
    ]);
}
}
