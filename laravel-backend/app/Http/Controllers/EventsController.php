<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Services;
use App\Services\SocketService;  // ← Add this
use Illuminate\Http\Request;

class EventsController extends Controller
{
    public function __construct(
        protected Services $services,
        protected SocketService $socket  // ← Add this
    ) {}

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
        
        // ✅ Emit socket event
        $this->socket->emitEventUpdate([
            'id' => $event->id,
            'title' => $event->title,
            'status' => $event->status,
            'action' => 'created'
        ]);
        
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
        
        // ✅ Emit socket event
        $this->socket->emitEventUpdate([
            'id' => $event->id,
            'title' => $event->title,
            'status' => $event->status,
            'action' => 'updated'
        ]);
        
        return response()->json($event);
    }
    public function destroy(int $id)
{
    $event = $this->services->deleteEvent($id);

    $this->socket->emitEventUpdate([
        'id'     => $id,
        'action' => 'deleted'
    ]);

    return response()->json(['message' => 'Event deleted successfully']);
}
}