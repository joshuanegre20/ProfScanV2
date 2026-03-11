<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Services;
use Illuminate\Http\Request;

class EventsController extends Controller
{
    public function __construct(
        protected Services $services
    ) {}

    public function index(Request $request)
    {
        $events = $this->services->getEvents($request->only(['search', 'type', 'status']));
        return response()->json($events);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'date'        => 'required|date',
            'date_ends'   => 'required|date|after_or_equal:date',
            'start'       => 'required|string',
            'ends'        => 'nullable|string',
            'location'    => 'required|string',
            'type'        => 'required|in:Academic,Administrative,Training,Social',
            'status'      => 'required|in:Upcoming,Ongoing,Completed',
        ]);

        $event = $this->services->addEvents($data);
        return response()->json($event, 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'date'        => 'sometimes|date',
            'date_ends'   => 'sometimes|date|after_or_equal:date',
            'start'       => 'sometimes|string',
            'ends'        => 'nullable|string',
            'location'    => 'sometimes|string',
            'type'        => 'sometimes|in:Academic,Administrative,Training,Social',
            'status'      => 'sometimes|in:Upcoming,Ongoing,Completed',
        ]);

        $event = $this->services->updateEvent($id, $data);
        return response()->json($event);
    }

    public function destroy(int $id)
    {
        $this->services->deleteEvent($id);
        return response()->json(['message' => 'Event deleted successfully']);
    }
}