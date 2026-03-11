<?php

namespace App\Repository;

use App\Models\User;
use App\Models\EventModel;
use App\Models\ScheduleModel;

class Repository implements RepositoryInterface
{
    public function getAll(array $filters = [])
    {
        $query = User::where('role', 'instructor');

        if (!empty($filters['department'])) {
            $query->where('department', $filters['department']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('email', 'like', "%{$filters['search']}%")
                  ->orWhere('instructor_id', 'like', "%{$filters['search']}%");
            });
        }

        return $query->latest()->get();
    }

    public function findById(int $id)
    {
        return User::where('role', 'instructor')->findOrFail($id);
    }

    public function create(array $data)
    {
        return User::create($data);
    }

    public function update(int $id, array $data)
    {
        $instructor = $this->findById($id);
        $instructor->update($data);
        return $instructor;
    }

    public function delete(int $id)
    {
        $instructor = $this->findById($id);
        $instructor->delete();
        return true;
    }

    public function updateStatus(int $id, string $status)
    {
        $instructor = $this->findById($id);
        $instructor->update(['status' => $status]);
        return $instructor;
    }

    public function getEvents(array $filters = [])
    {
        $query = EventModel::query();

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->where('title', 'like', "%{$filters['search']}%");
        }

        return $query->latest()->get();
    }

    public function getEvent(int $id)
    {
        return EventModel::findOrFail($id);
    }

    public function addEvents(array $data)
    {
        return EventModel::create($data);
    }

    public function updateEvent(int $id, array $data)
    {
        $event = $this->getEvent($id);
        $event->update($data);
        return $event;
    }

    public function deleteEvent(int $id)
    {
        $event = $this->getEvent($id);
        $event->delete();
        return true;
    }

    public function addSchedule(array $data)
    {
        return ScheduleModel::create($data);
    }

    public function getSchedules(array $filters = [])
{
    $query = ScheduleModel::query();

    if (!empty($filters['day'])) {
        $query->where('day', $filters['day']);
    }

    if (!empty($filters['status'])) {
        $query->where('status', $filters['status']);
    }

    if (!empty($filters['search'])) {
        $query->where(function ($q) use ($filters) {
            $q->where('name', 'like', "%{$filters['search']}%")
              ->orWhere('subject', 'like', "%{$filters['search']}%")
              ->orWhere('instructor_id', 'like', "%{$filters['search']}%");
        });
    }

    return $query->latest()->get();
}

public function getSchedule(int $id)
{
    return ScheduleModel::findOrFail($id);
}

public function updateSchedule(int $id, array $data)
{
    $schedule = $this->getSchedule($id);
    $schedule->update($data);
    return $schedule;
}

public function deleteSchedule(int $id)
{
    $schedule = $this->getSchedule($id);
    $schedule->delete();
    return true;
}

public function updateById(int $id, array $data): mixed
{
    $user = User::findOrFail($id);  // ← uses primary key id
    $user->update($data);
    return $user;
}

}