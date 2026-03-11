<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Services;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected Services $services
    ) {}

    public function stats()
    {
        $total    = User::where('role', 'instructor')->count();
        $active   = User::where('role', 'instructor')->where('status', 'Active')->count();
        $inactive = User::where('role', 'instructor')->where('status', 'Inactive')->count();

        $totalEvents    = $this->services->getEvents()->count();
        $upcomingEvents = $this->services->getEvents(['status' => 'Upcoming'])->count();

        return response()->json([
            'total'           => $total,
            'active'          => $active,
            'inactive'        => $inactive,
            'active_rate'     => $total > 0 ? round(($active / $total) * 100) : 0,
            'total_events'    => $totalEvents,
            'upcoming_events' => $upcomingEvents,
        ]);
    }

    public function instructors()
    {
        $instructors = $this->services->getAll();
        return response()->json($instructors);
    }

    public function getEvents(Request $request)
    {
        $events = $this->services->getEvents($request->only(['search', 'type', 'status']));
        return response()->json($events);
    }
    
}