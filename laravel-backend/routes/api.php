<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\EventsController;
use App\Http\Controllers\InstructorController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\ActivityController;

// ── Public ────────────────────────────────────────────────────────
Route::get('/test', fn() => response()->json(['message' => 'API works']));
Route::post('/login', [AuthController::class, 'login'])->name('login');

Route::get('/logo', function () {
    $path = 'logo/tmclogo2.png';
    if (!Storage::disk('private')->exists($path)) abort(404);
    return response()->stream(
        fn() => print(Storage::disk('private')->get($path)),
        200,
        ['Content-Type' => 'image/png', 'Cache-Control' => 'no-store']
    );
});

// ── ESP32 (no auth) ───────────────────────────────────────────────
Route::post('/scan',               [DeviceController::class, 'scan']);
Route::post('/devices/register',   [DeviceController::class, 'register']);
Route::post('/devices/heartbeat',  [DeviceController::class, 'heartbeat']);
Route::get('/devices',             [DeviceController::class, 'index']);
Route::post('/devices',            [DeviceController::class, 'store']);
Route::put('/devices/{id}',        [DeviceController::class, 'update']);
Route::delete('/devices/{id}',     [DeviceController::class, 'destroy']);

// ── Authenticated ─────────────────────────────────────────────────
  
Route::middleware('auth:api')->group(function () {

    // Auth
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/instructor/change-password', [InstructorController::class, 'changePassword']);
    
    Route::post('/auth/send-verification-code', [AuthController::class, 'sendVerificationCode']);
    Route::post('/auth/resend-verification', [AuthController::class, 'resendVerification']);
     Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);

    // ── Admin: Dashboard ──────────────────────────────────────────
    Route::get('/admin/stats',              [DashboardController::class, 'stats']);
    Route::get('/admin/stats/departments',  [DashboardController::class, 'departmentStats']);
    Route::get('/admin/stats/events',       [DashboardController::class, 'eventStats']);
    Route::get('/admin/recent-scans',       [AdminController::class,     'recentScans']);

    // ── Admin: Activities (must be inside auth) ───────────────────
    Route::get('/admin/activities',             [ActivityController::class, 'getRecentActivities']);
    Route::get('/activities/device/{deviceId}', [ActivityController::class, 'getDeviceActivities']);

    // ── Admin: Profile ────────────────────────────────────────────
    Route::get('/admin/me',               [AdminController::class, 'me']);
    Route::put('/admin/profile',          [AdminController::class, 'updateProfile']);
    Route::post('/admin/change-password', [AdminController::class, 'changePassword']);
    Route::post('/admin/avatar',          [AdminController::class, 'updateAvatar']);
    Route::get('/admin/photo',            [AdminController::class, 'photo']);

    // ── Admin: Instructors ────────────────────────────────────────
    Route::get('/admin/instructors',               [InstructorController::class, 'index']);
    Route::post('/admin/instructors',              [InstructorController::class, 'store']);
    Route::put('/admin/instructors/{id}',          [InstructorController::class, 'update']);
    Route::delete('/admin/instructors/{id}',       [InstructorController::class, 'destroy']);
    Route::patch('/admin/instructors/{id}/status', [InstructorController::class, 'updateStatus']);
    Route::get('/admin/instructors/{id}/photo',    [InstructorController::class, 'photo'])->name('api.instructor.photo');
    Route::get('/admin/instructors/{id}/scan-logs',       [InstructorController::class, 'getScanLogs']);
    Route::get('/admin/instructors/{id}/attendance-logs', [InstructorController::class, 'getAttendanceLogs']);

    // ── Admin: Events ─────────────────────────────────────────────
    Route::get('/admin/events',         [DashboardController::class, 'getEvents']);
    Route::post('/admin/events',        [EventsController::class,    'store']);
    Route::put('/admin/events/{id}',    [EventsController::class,    'update']);
    Route::delete('/admin/events/{id}', [EventsController::class,    'destroy']);

    // ── Admin: Schedules ──────────────────────────────────────────
    Route::get('/admin/schedules',         [ScheduleController::class, 'index']);
    Route::post('/admin/schedules',        [ScheduleController::class, 'store']);
    Route::put('/admin/schedules/{id}',    [ScheduleController::class, 'update']);
    Route::delete('/admin/schedules/{id}', [ScheduleController::class, 'destroy']);

    // ── Schedule Actions (must be inside auth) ────────────────────
    Route::post('/admin/schedules/set-ongoing',             [ScheduleController::class,   'setOngoing']);
    Route::post('/admin/schedules/excuse-all-today',        [ScheduleController::class,   'excuseAllToday']);
    Route::post('/admin/schedules/mark-absent',             [InstructorController::class, 'markAbsent']);
    Route::post('/admin/attendance-logs/mark-absent-manual',[InstructorController::class, 'markAbsentManual']);

    // ── Admin: Subjects & Departments ────────────────────────────
    Route::get('/admin/subjects',         [SubjectController::class,    'index']);
    Route::post('/admin/subjects',        [SubjectController::class,    'store']);
    Route::delete('/admin/subjects/{id}', [SubjectController::class, 'destroy']);
    Route::get('/admin/departments',      [DepartmentController::class, 'index']);
    Route::post('/admin/departments',     [DepartmentController::class, 'store']);
    Route::delete('/admin/departments/{id}', [DepartmentController::class, 'destroy']);

    // ── Staff: Admin management ───────────────────────────────────
    Route::get('/staff',               [StaffController::class, 'index']);
    Route::post('/staff',              [StaffController::class, 'store']);
    Route::delete('/staff/{id}',       [StaffController::class, 'destroy']);
    Route::patch('/staff/{id}/status', [StaffController::class, 'updateStatus']);
    Route::get('/staff/{id}/photo',    [StaffController::class, 'photo']);

    // ── Staff: Portal (MUST be before /staff/{id}) ───────────────
    Route::get('/staff/me',         [InstructorController::class, 'staffMe']);
    Route::put('/staff/profile',    [InstructorController::class, 'staffUpdateProfile']);
    Route::get('/staff/attendance', [InstructorController::class, 'myAttendanceLogs']);
    Route::get('/staff/photo/me',   [InstructorController::class, 'staffPhoto']);

    // ── Instructor: Portal ────────────────────────────────────────
  Route::get('/instructor/me',               [AuthController::class, 'me']);
    Route::put('/instructor/profile',          [InstructorController::class, 'updateProfile']);
    Route::post('/instructor/change-password', [InstructorController::class, 'changePassword']);
    Route::post('/instructor/avatar',          [InstructorController::class, 'updateAvatar']);
    Route::get('/instructor/photo',            [InstructorController::class, 'getPhoto']);
    Route::get('/instructor/schedules',        [InstructorController::class, 'schedules']);
    Route::get('/instructor/scan-logs',        [InstructorController::class, 'myScanLogs']);
    Route::get('/instructor/attendance-logs',  [InstructorController::class, 'myAttendanceLogs']);
     Route::get('/instructor/attendance-logs-me',  [InstructorController::class, 'myAttendanceLogsMe']);
});