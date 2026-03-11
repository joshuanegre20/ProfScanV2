<?php

namespace App\Http\Controllers;

use App\Services\Services;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function __construct(
        protected Services $services
    ) {}

    public function index(Request $request)
{
    $schedules = $this->services->getSchedules(
        $request->only(['search', 'day', 'status', 'instructor_id'])  // ← add instructor_id
    );
    return response()->json($schedules);
}

    public function store(Request $request)
    {
        $data = $request->validate([
            'instructor_id' => 'required|string',
            'name'          => 'required|string|max:255',
            'subject'       => 'required|string|max:255',
            'time'          => 'required|string',
            'end_time'      => 'nullable|string',
            'day'           => 'required|in:MWF,TTH,SAT,SUN,SAT-SUN',
            'status'        => 'required|in:Upcoming,Ongoing,Attended',
            'subject_code' => 'required|string|max:50',  
        ]);

        $schedule = $this->services->addSchedule($data);
        return response()->json($schedule, 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'instructor_id' => 'sometimes|string',
            'name'          => 'sometimes|string|max:255',
            'subject'       => 'sometimes|string|max:255',
            'time'          => 'sometimes|string',
            'end_time'      => 'nullable|string',
            'day'           => 'sometimes|in:MWF,TTH,SAT,SUN,SAT-SUN',
            'status'        => 'sometimes|in:Upcoming,Ongoing,Attended',
            'subject_code' => 'sometimes|string|max:50',
        ]);

        $schedule = $this->services->updateSchedule($id, $data);
        return response()->json($schedule);
    }

    public function destroy(int $id)
    {
        $this->services->deleteSchedule($id);
        return response()->json(['message' => 'Schedule deleted successfully']);
    }
}