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
    public function departmentStats()
{
    try {
        $total = \App\Models\User::where('role', 'instructor')->count();

        $stats = \App\Models\User::where('role', 'instructor')
            ->selectRaw('department, COUNT(*) as count, SUM(CASE WHEN status = "Active" THEN 1 ELSE 0 END) as active_count')
            ->groupBy('department')
            ->orderByDesc('count')
            ->get()
            ->map(fn($d) => [
                'department'   => $d->department ?? 'Unassigned',
                'count'        => (int) $d->count,
                'active_count' => (int) $d->active_count,
                'percentage'   => $total > 0 ? round(($d->count / $total) * 100, 1) : 0,
            ]);

        return response()->json($stats);
    } catch (\Exception $e) {
        return response()->json([], 200);
    }
}

public function eventStats()
{
    try {
        $today = now()->startOfDay();

        $upcoming = \App\Models\EventModel::where('date', '>=', $today)
            ->selectRaw('DATE_FORMAT(date, "%b %Y") as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('date')
            ->limit(6)
            ->get()
            ->map(fn($e) => [
                'month' => $e->month,
                'count' => (int) $e->count,
                'type'  => 'upcoming',
            ]);

        $past = \App\Models\EventModel::where('date', '<', $today)
            ->selectRaw('DATE_FORMAT(date, "%b %Y") as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderByDesc('date')
            ->limit(6)
            ->get()
            ->map(fn($e) => [
                'month' => $e->month,
                'count' => (int) $e->count,
                'type'  => 'past',
            ]);

        return response()->json($upcoming->merge($past)->values());
    } catch (\Exception $e) {
        return response()->json([], 200);
    }
}

    public function instructors()
    {
        $instructors = $this->services->getAll();
        return response()->json($instructors);
    }

    public function staffs(Request $request)
{
    $staff = $this->services->getAllStaff($request->only(['search']));
    return response()->json($staff);
}

    public function getEvents(Request $request)
    {
        $events = $this->services->getEvents($request->only(['search', 'type', 'status']));
        return response()->json($events);
    }
    
}