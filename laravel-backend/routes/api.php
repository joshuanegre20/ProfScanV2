<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\EventsController;
use App\Http\Controllers\InstructorController;
use App\Http\Controllers\ScanController;

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API works']);
});

// Auth routes
Route::post('/login', [AuthController::class, 'login']);

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

    Route::post('/scan', [ScanController::class, 'store']);

Route::middleware('auth:api')->group(function () {

    // Auth
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard stats
    Route::get('/admin/stats', [DashboardController::class, 'stats']);

    // Instructors
    Route::get('/admin/instructors',              [InstructorController::class, 'index']);  // ← fixed
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
});