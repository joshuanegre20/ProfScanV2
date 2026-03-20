<?php
// app/Http/Controllers/ActivityController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Services;

class ActivityController extends Controller
{
    protected $services;

    public function __construct(Services $services)
    {
        $this->services = $services;
    }

    public function getRecentActivities(Request $request)
    {
        try {
            $filters = $request->only(['type', 'device_id', 'instructor_id', 'staff_id', 'from_date', 'to_date']);
            $limit = $request->get('limit', 50);
            
            $activities = $this->services->getRecentActivities($limit, $filters);
            
            return response()->json([
                'success' => true,
                'data' => $activities
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activities',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getDeviceActivities($deviceId, Request $request)
    {
        try {
            $limit = $request->get('limit', 50);
            $activities = $this->services->getDeviceActivities($deviceId, $limit);
            
            return response()->json([
                'success' => true,
                'data' => $activities
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch device activities',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}