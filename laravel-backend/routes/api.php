<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\EventsController;
use App\Http\Controllers\InstructorController;
use App\Http\Controllers\ScanController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\ActivityController;

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API works']);
});

// Auth routes
Route::post('/login', [AuthController::class, 'login'])->name('login');

Route::middleware('auth:api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});



Route::get('/logo', function () {
    $path = 'logo/tmclogo2.png';

    if (!Storage::disk('private')->exists($path)) {
        abort(404);
    }

    return response()->stream(function () use ($path) {
        echo Storage::disk('private')->get($path);
    }, 200, [
        'Content-Type' => 'image/png',
        'Cache-Control' => 'no-store',
    ]);
});



    //Route::middleware('auth:api')->group(function () {
    //Route::get('/admin/stats',        [DashboardController::class, 'stats']);
    //Route::get('/admin/instructors',  [DashboardController::class, 'instructors']);
    // Route::get('/admin/events',  [DashboardController::class, 'getEvents']);
    //Route::get('/admin/instructors/{id}/photo', [InstructorController::class, 'photo'])
    // ->name('api.instructor.photo');
    // Route::get('/admin/schedules', [ScheduleController::class, 'index']);
    //Route::post('/admin/schedules', [ScheduleController::class, 'store']);
    //Route::put('/admin/schedules/{id}', [ScheduleController::class, 'update']);
    //Route::delete('/admin/schedules/{id}', [ScheduleController::class, 'destroy']);
//
    //Route::post('/admin/instructors', [InstructorController::class, 'store']);
    //});

    //Route::post('/scan', [ScanController::class, 'store']);
 Route::prefix('devices')->group(function () {
    Route::get('/',              [DeviceController::class, 'index']);
    Route::post('/',             [DeviceController::class, 'store']);
    Route::put('/{id}',          [DeviceController::class, 'update']);
    Route::delete('/{id}',       [DeviceController::class, 'destroy']);
    Route::post('/register',     [DeviceController::class, 'register']);  
     Route::post('/heartbeat', [DeviceController::class, 'heartbeat']); 
});
 
Route::post('/scan', [DeviceController::class, 'scan']);  // ESP32 scan POST
Route::middleware('auth:api')->group(function () {

    // Auth
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard stats
    Route::get('/admin/stats', [DashboardController::class, 'stats']);
    Route::get('/admin/stats/departments', [DashboardController::class, 'departmentStats']);
Route::get('/admin/stats/events',      [DashboardController::class, 'eventStats']);

    // Instructors
    Route::get('/admin/instructors',              [InstructorController::class, 'index']); 
    Route::post('/admin/instructors',             [InstructorController::class, 'store']);
    Route::put('/admin/instructors/{id}',         [InstructorController::class, 'update']);
    Route::delete('/admin/instructors/{id}',      [InstructorController::class, 'destroy']);
    Route::patch('/admin/instructors/{id}/status',[InstructorController::class, 'updateStatus']);
    Route::get('/admin/instructors/{id}/photo',   [InstructorController::class, 'photo'])
         ->name('api.instructor.photo');
         
    Route::get('/admin/me', [AdminController::class, 'me']);
    Route::post('/admin/change-password', [AdminController::class, 'changePassword']);
    Route::post('/admin/avatar', [AdminController::class, 'updateAvatar']);
    Route::get('/admin/photo', [AdminController::class, 'photo']);
    
    Route::put('/admin/profile', [AdminController::class, 'updateProfile']);

    // Events
    Route::get('/admin/events',         [DashboardController::class, 'getEvents']);
    Route::post('/admin/events',        [EventsController::class, 'store']);
    Route::put('/admin/events/{id}',    [EventsController::class, 'update']);
    Route::delete('/admin/events/{id}', [EventsController::class, 'destroy']);

    // Schedules
    Route::get('/admin/schedules',         [ScheduleController::class, 'index']);
    Route::post('/admin/schedules',        [ScheduleController::class, 'store']);
    Route::put('/admin/schedules/{id}',    [ScheduleController::class, 'update']);
    Route::delete('/admin/schedules/{id}', [ScheduleController::class, 'destroy']);

    //Recent
    Route::get('/admin/recent-scans', [AdminController::class, 'recentScans']);

     Route::get('/instructor/me',               [InstructorController::class, 'me']);
    Route::put('/instructor/profile',          [InstructorController::class, 'updateProfile']);
    Route::post('/instructor/change-password', [InstructorController::class, 'changePassword']);
    Route::post('/instructor/avatar',          [InstructorController::class, 'updateAvatar']);
    Route::get('/instructor/schedules',        [InstructorController::class, 'schedules']);
    Route::get('/instructor/scan-logs',        [InstructorController::class, 'scanLogs']);

   Route::prefix('staff')->group(function () {
    Route::get('/',               [StaffController::class, 'index']);
    Route::post('/',              [StaffController::class, 'store']);
    Route::delete('/{id}',        [StaffController::class, 'destroy']);
    Route::patch('/{id}/status',  [StaffController::class, 'updateStatus']);
    Route::get('/{id}/photo',     [StaffController::class, 'photo']);

   
});
 Route::post('/admin/subjects', [SubjectController::class, 'store']);
 
Route::get('/admin/subjects', [SubjectController::class, 'index']);
 
Route::post('/admin/departments',[DepartmentController::class, 'store']);
Route::get('/admin/departments',[DepartmentController::class, 'index']);
Route::get('/instructor/photo', [InstructorController::class, 'getPhoto']);
Route::get('/admin/instructors/{id}/scan-logs', [InstructorController::class, 'getScanLogs']);
Route::get('/instructor/scan-logs', [InstructorController::class, 'myScanLogs']);
Route::get('/admin/instructors/{id}/attendance-logs', [InstructorController::class, 'getAttendanceLogs']);
Route::get('/instructor/attendance-logs', [InstructorController::class, 'myAttendanceLogs']);
Route::post('/admin/attendance-logs/mark-absent-manual', [InstructorController::class, 'markAbsentManual']);
Route::post('/admin/schedules/excuse-all-today', [ScheduleController::class, 'excuseAllToday']);
// Staff portal
Route::get('/staff/me',         [InstructorController::class, 'staffMe']);
Route::put('/staff/profile',    [InstructorController::class, 'staffUpdateProfile']);
Route::get('/staff/attendance', [InstructorController::class, 'staffAttendance']);
Route::get('/staff/attendance', [InstructorController::class, 'myAttendanceLogs']);
Route::get('/staff/photo/me', [InstructorController::class, 'staffPhoto']);
});
Route::post('/admin/schedules/set-ongoing', [ScheduleController::class, 'setOngoing']);
Route::post('/admin/schedules/mark-absent', [InstructorController::class, 'markAbsent']);
Route::get('/admin/activities', [ActivityController::class, 'getRecentActivities']);
Route::get('/activities/device/{deviceId}', [ActivityController::class, 'getDeviceActivities']);
