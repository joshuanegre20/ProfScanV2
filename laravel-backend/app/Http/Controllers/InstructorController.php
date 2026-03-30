<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ScheduleModel;
use App\Models\ActivityModel;
use App\Services\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class InstructorController extends Controller
{
    public function __construct(
        protected Services $services
    ) {}

    /**
     * Get all instructors (for admin panel)
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->only(['search', 'department']);
            $instructors = $this->services->getAll($filters);

            return response()->json($instructors->map(function ($instructor) {
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
                    'join_date'      => $instructor->hire_date ?? $instructor->created_at,
                    'profile_url'    => $hasValidPhoto
                                            ? url("/api/admin/instructors/{$instructor->id}/photo")
                                            : null,
                ];
            }));
        } catch (\Exception $e) {
            \Log::error('Failed to fetch instructors: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch instructors',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id'    => 'required|string|unique:users,instructor_id',
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users',
            'password'       => 'required|min:8|confirmed',
            'department'     => 'required|string',
            'specialization' => 'required|string',
            'contact_no'     => 'required|string',
            'age'            => 'required|integer',
            'gender'         => 'required|string',
            'birth_date'     => 'required|date',
            'address'        => 'required|string',
            'photo'          => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'qr_payload'     => 'nullable|string',
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

    // ── Instructor Portal endpoints ──────────────────────────────────────────
    public function me(Request $request)
{
    try {
        $user = $request->user();
        
        // Check if user is an instructor
        if ($user->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Instructor access required.'
            ], 403);
        }

        // Get instructor details from users table
        return response()->json([
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'status'         => $user->status ?? 'Active',
            'instructor_id'  => $user->instructor_id,
            'department'     => $user->department,
            'specialization' => $user->specialization,
            'profile_url'    => $user->profile_url ? url('/api/instructor/photo') : null,
            'qr_payload'     => $user->qr_payload,
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Instructor me error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch instructor profile'
        ], 500);
    }
}
public function markAbsentManual(Request $request)
{
    try {
        $request->validate([
            'instructor_id' => 'required|string',
            'schedule_id'   => 'required|integer',
        ]);

        $today = now()->format('Y-m-d');

        // Check schedule status first
        $schedule = DB::table('schedule')
            ->where('id', $request->schedule_id)
            ->first();

        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Schedule not found'], 404);
        }

        // Don't proceed if status is upcoming or ongoing
        if ($schedule->status === 'Upcoming' || $schedule->status === 'Ongoing') {
            return response()->json([
                'success' => false, 
                'message' => 'Cannot mark absent for schedule with status: ' . $schedule->status
            ], 400);
        }

        // Check if already logged today
        $alreadyLogged = DB::table('attendance_logs_db')
            ->where('instructor_id', $request->instructor_id)
            ->where('schedule_id',   $request->schedule_id)
            ->where('date',          $today)
            ->exists();

        if ($alreadyLogged) {
            return response()->json(['success' => true, 'message' => 'Already logged']);
        }

        // Insert attendance record
        DB::table('attendance_logs_db')->insert([
            'instructor_id' => $request->instructor_id,
            'schedule_id'   => $request->schedule_id,
            'room'          => $request->room     ?? null,
            'subject'       => $request->subject  ?? null,
            'code'          => $request->code     ?? null,
            'day'           => $request->day      ?? null,
            'time_in'       => null,
            'time_out'      => $request->time_out ?? null,
            'date'          => $today,
            'status'        => 'Absent',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // Update schedule status to Absent
        DB::statement('UPDATE `schedule` SET `status` = ?, `attendance` = ? WHERE `id` = ?', [
            'Absent', 'Absent', $request->schedule_id
        ]);

        return response()->json(['success' => true, 'message' => 'Marked absent successfully']);
        
    } catch (\Exception $e) {
        \Log::error('markAbsentManual error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'       => 'sometimes|string|max:255',
            'email'      => 'sometimes|email|unique:users,email,' . $user->id,
            'department' => 'nullable|string|max:255',
        ]);

        $user->update($request->only(['name', 'email', 'department']));

        return response()->json(['success' => true, 'message' => 'Profile updated.', 'user' => $user]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['success' => true, 'message' => 'Password changed successfully.']);
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        // Delete old photo if exists
        if ($user->profile_url) {
            Storage::disk('private')->delete($user->profile_url);
        }

        // Store new photo
        $path = $request->file('photo')->store('instructors', 'private');
        $user->update(['profile_url' => $path]);

        return response()->json([
            'success' => true,
            'profile_url' => url('/api/instructor/photo'),
            'message' => 'Avatar updated successfully'
        ]);
    }

    public function schedules(Request $request)
    {
        $user = $request->user();

        $schedules = ScheduleModel::where('instructor_id', $user->instructor_id)
            ->orderByRaw("FIELD(day, 'MWF', 'TTH', 'SAT', 'SUN')")
            ->orderBy('time')
            ->get();

        return response()->json($schedules);
    }

    // In your InstructorController.php
public function scanLogs($id)
{
    $logs = DB::table('activities')
        ->join('schedule', 'activities.scanned_schedule', '=', 'schedule.id')
        ->where('activities.instructor_id', $id)
        ->where('activities.type', 'scan')
        ->select(
            'activities.id',
            'activities.created_at as date',
            'schedule.subject',
            'schedule.subject_code',
            'schedule.day',
            'schedule.time',
            'schedule.end_time',
            'schedule.room',
            'schedule.status'
        )
        ->orderBy('activities.created_at', 'desc')
        ->get();
    
    return response()->json($logs);
}

/**
 * Get scan logs for a specific instructor (for admin panel)
 */
public function getScanLogs($id)
{
    try {
        // Find the instructor by ID
        $instructor = User::where('role', 'instructor')
            ->where('id', $id)
            ->first();
        
        if (!$instructor) {
            return response()->json([
                'success' => false,
                'message' => 'Instructor not found'
            ], 404);
        }

        // Get scan activities with schedule data using JOIN
        $logs = DB::table('activities')
            ->leftJoin('schedule', 'activities.scanned_schedule', '=', 'schedule.id')
            ->where('activities.instructor_id', $instructor->instructor_id)
            ->where('activities.type', 'scan')
            ->select(
                'activities.id',
                'activities.created_at as date',
                'schedule.subject',
                'schedule.subject_code',
                'schedule.day',
                'schedule.time',
                'schedule.end_time',
                'schedule.room',
                'schedule.status',
                'activities.success',
                'activities.message'
            )
            ->orderBy('activities.created_at', 'desc')
            ->get();

        // Format the response
        $formattedLogs = $logs->map(function($log) {
            $scanTime = \Carbon\Carbon::parse($log->date);
            return [
                'id' => $log->id,
                'date' => $log->date,
                'day' => $log->day ?? $scanTime->format('l'),
                'subject' => $log->subject ?? 'No Class Scheduled',
                'subject_code' => $log->subject_code ?? '—',
                'room' => $log->room ?? '—',
                'time' => $log->time 
                    ? $log->time . ($log->end_time ? ' - ' . substr($log->end_time, 0, 5) : '')
                    : $scanTime->format('h:i A'),
                'status' => $log->status ?? 'Scan Only',
                'success' => $log->success ?? true,
                'message' => $log->message ?? 'Scan recorded'
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedLogs
        ]);

    } catch (\Exception $e) {
        \Log::error('Failed to fetch scan logs: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch scan logs'
        ], 500);
    }
}

public function getAttendanceLogs($id)
{
    try {
        $instructor = User::where('role', 'instructor')
            ->where('id', $id)
            ->first();

        if (!$instructor) {
            return response()->json([
                'success' => false,
                'message' => 'Instructor not found'
            ], 404);
        }

        $logs = DB::table('attendance_logs_db')
            ->where('instructor_id', $instructor->instructor_id)
            ->orderBy('date', 'desc')
            ->orderBy('time_in', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id'           => $log->id,
                    'date'         => $log->date,
                    'day'          => $log->day,
                    'subject'      => $log->subject ?? '—',
                    'subject_code' => $log->subject_code ?? '—',
                    'room'         => $log->room ?? '—',
                    'time'         => $log->time_in
                                        ? substr($log->time_in, 0, 5)
                                        : '—',
                    'end_time'     => $log->time_out
                                        ? substr($log->time_out, 0, 5)
                                        : null,
                    'status'       => $log->status ?? '—',
                    'success'      => true,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $logs
        ]);

    } catch (\Exception $e) {
        \Log::error('Failed to fetch attendance logs: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch attendance logs'
        ], 500);
    }
}

public function markAbsent(Request $request)
{
    try {
        $request->validate([
            'instructor_id' => 'required|string',
            'schedule_id'   => 'required|integer',
        ]);

        $today = now()->format('Y-m-d');

        // Check if already logged today for this schedule
        $alreadyLogged = DB::table('attendance_logs_db')
            ->where('instructor_id', $request->instructor_id)
            ->where('date', $today)
            ->where('schedule_id', $request->schedule_id)
            ->exists();

        if ($alreadyLogged) {
            return response()->json(['success' => true, 'message' => 'Already logged']);
        }

        // Get schedule details
        $schedule = \App\Models\ScheduleModel::find($request->schedule_id);

        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Schedule not found'], 404);
        }

        // Insert absent log
        \App\Models\AttendanceLogs::create([
            'instructor_id' => $request->instructor_id,
            'room'          => $schedule->room ?? null,
            'time_in'       => null,
            'time_out'      => null,
            'date'          => $today,
            'status'        => 'Absent',
            'day'           => $schedule->day,
            'subject'       => $schedule->subject ?? null,
            'code'          => $schedule->subject_code ?? null,
        ]);

        // Update schedule status
        $schedule->status     = 'Absent';
        $schedule->attendance = 'Absent';
        $schedule->save();

        return response()->json(['success' => true, 'message' => 'Marked absent successfully']);

    } catch (\Exception $e) {
        \Log::error('Mark absent error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

public function setOngoing(Request $request)
{
    try {
        $request->validate([
            'schedule_id'   => 'required|integer',
            'instructor_id' => 'required|string',
        ]);

        $today = now()->format('Y-m-d');

        // Update schedule status to Ongoing
        DB::table('schedule')
            ->where('id', $request->schedule_id)
            ->update(['status' => 'Ongoing']);

        // Check if already logged today
        $alreadyLogged = DB::table('attendance_logs_db')
            ->where('instructor_id', $request->instructor_id)
            ->where('schedule_id',   $request->schedule_id)
            ->where('date',          $today)
            ->exists();

        if (!$alreadyLogged) {
            DB::table('attendance_logs_db')->insert([
                'instructor_id' => $request->instructor_id,
                'schedule_id'   => $request->schedule_id,
                'room'          => $request->room     ?? null,
                'subject'       => $request->subject  ?? null,
                'code'          => $request->code     ?? null,
                'day'           => $request->day      ?? null,
                'time_in'       => null,
                'time_out'      => $request->end_time ?? null,
                'date'          => $today,
                'status'        => 'Absent',
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Schedule set to Ongoing and absent log inserted'
        ]);

    } catch (\Exception $e) {
        \Log::error('Set ongoing error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}
public function myAttendanceLogs(Request $request)
{
    $month = $request->get('month');

    $query = DB::table('attendance_logs_db');

    if ($month) {
        $query->whereRaw("LEFT(date, 7) = ?", [$month]);
    }

    $logs = $query
        ->orderBy('date', 'desc')
        ->orderBy('time_in', 'desc')
        ->get()
        ->map(function ($log) {
            return [
                'id'            => $log->id,
                'instructor_id' => $log->instructor_id,
                'date'          => $log->date,
                'day'           => $log->day,
                'subject'       => $log->subject,
                'code'          => $log->code,
                'room'          => $log->room,
                'time_in'       => $log->time_in,
                'time_out'      => $log->time_out,
                'status'        => $log->status,
            ];
        });

    return response()->json([
        'success' => true,
        'data'    => $logs,
    ]);
}
public function myAttendanceLogsMe(Request $request)
{
    $user = auth()->user();

    $month = $request->get('month');
    

    $query = DB::table('attendance_logs_db');

    if ($month) {
        $query->whereRaw("LEFT(date, 7) = ?", [$month]);
    }

    $logs = $query
        ->orderBy('date', 'desc')
        ->orderBy('time_in', 'desc') ->where('instructor_id', $user->instructor_id)
        ->get()
        ->map(function ($log) {
            return [
                'id'            => $log->id,
                'instructor_id' => $log->instructor_id,
                'date'          => $log->date,
                'day'           => $log->day,
                'subject'       => $log->subject,
                'code'          => $log->code,
                'room'          => $log->room,
                'time_in'       => $log->time_in,
                'time_out'      => $log->time_out,
                'status'        => $log->status,
            ];
        });

    return response()->json([
        'success' => true,
        'data'    => $logs,
    ]);
}

/**
 * Get scan logs for the authenticated instructor (for instructor portal)
 */
public function myScanLogs(Request $request)
{
    $user = $request->user();
    $limit = (int) $request->query('limit', 20);

    $logs = ScheduleModel::where('instructor_id', $user->instructor_id)
        ->whereIn('status', ['Present', 'Attended'])
        ->orderByDesc('updated_at')
        ->limit($limit)
        ->get()
        ->map(fn($s) => [
            'id'         => $s->id,
            'subject'    => $s->subject,
            'room'       => $s->room ?? null,
            'day'        => $s->day,
            'time'       => $s->time,
            'end_time'   => $s->end_time,
            'status'     => $s->status,
            'scanned_at' => $s->updated_at,
        ]);

    return response()->json($logs);
}
    public function getPhoto(Request $request)
    {
        $instructor = $request->user();

        if (!$instructor->profile_url || !Storage::disk('private')->exists($instructor->profile_url)) {
            abort(404);
        }

        $file = Storage::disk('private')->get($instructor->profile_url);
        $mimeType = Storage::disk('private')->mimeType($instructor->profile_url);

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    // ── Staff Portal endpoints ────────────────────────────────────────

public function staffMe(Request $request)
{
    $user = $request->user();
    return response()->json([
        'id'          => $user->id,
        'name'        => $user->name,
        'email'       => $user->email,
        'staff_id'    => $user->staff_id,
        'contact_no'  => $user->contact_no  ?? null,
        'address'     => $user->address     ?? null,
        'gender'      => $user->gender      ?? null,
        'birth_date'  => $user->birth_date  ?? null,
        'age'         => $user->age         ?? null,
        'status'      => $user->status,
        'role'        => $user->role,
        'created_at'  => $user->created_at,
        'profile_url' => $user->profile_url
                            ? url('/api/staff/photo/me')
                            : null,
    ]);
}

public function staffUpdateProfile(Request $request)
{
    $user = $request->user();
    $data = $request->validate([
        'name'       => 'sometimes|string|max:255',
        'email'      => 'sometimes|email|unique:users,email,' . $user->id,
        'contact_no' => 'nullable|string|max:20',
        'address'    => 'nullable|string',
        'gender'     => 'nullable|in:Male,Female',
    ]);
    $user->update($data);
    return response()->json(['success' => true, 'message' => 'Profile updated.', 'user' => $user]);
}
public function staffPhoto(Request $request)
{
    $user = $request->user();

    if (!$user->profile_url || !Storage::disk('private')->exists($user->profile_url)) {
        abort(404);
    }

    return response(Storage::disk('private')->get($user->profile_url), 200)
        ->header('Content-Type', Storage::disk('private')->mimeType($user->profile_url))
        ->header('Cache-Control', 'no-store');
}

public function staffAttendance(Request $request)
{
    $user  = $request->user();
    $month = $request->get('month');

    $query = DB::table('attendance_logs_db')
        ->where('instructor_id', $user->staff_id);

    if ($month) {
        $query->whereRaw("LEFT(date, 7) = ?", [$month]);
    }

    $logs = $query->orderByDesc('date')->get()->map(fn($l) => [
        'id'       => $l->id,
        'date'     => $l->date,
        'day'      => $l->day      ?? null,
        'subject'  => $l->subject  ?? null,
        'room'     => $l->room     ?? null,
        'code'     => $l->code     ?? null,
        'time_in'  => $l->time_in  ?? null,
        'time_out' => $l->time_out ?? null,
        'status'   => $l->status   ?? null,
    ]);

    return response()->json($logs);
}
}