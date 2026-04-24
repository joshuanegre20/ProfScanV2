<?php

namespace App\Repository;

use App\Models\User;
use App\Models\EventModel;
use App\Models\ScheduleModel;
use App\Models\SubjectModel;
use App\Models\DepartmentModel;
use App\Models\ActivityModel;

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
              ->orWhere('instructor_id', 'like', "%{$filters['search']}%")
               ->orWhere('block', 'like', "%{$filters['search']}%"); 
        });
    }

    // ✅ Use orderBy id instead of latest() since timestamps = false
    $schedules = $query->orderBy('id', 'desc')->get();

    // ✅ Debug — remove after fixing
    \Log::info('getSchedules result sample:', $schedules->first() ? (array) $schedules->first()->toArray() : ['empty']);

    return $schedules;
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
public function getAllStaff(array $filters = [])
{
    $query = User::where('role', 'staff');
 
    if (!empty($filters['search'])) {
        $query->where(function ($q) use ($filters) {
            $q->where('name',  'like', "%{$filters['search']}%")
              ->orWhere('email', 'like', "%{$filters['search']}%")
              ->orWhere('staff_id', 'like', "%{$filters['search']}%");
        });
    }
 
    return $query->latest()->get();
}
 
public function findStaffById(int $id)
{
    return User::where('role', 'staff')->findOrFail($id);
}
 
public function createStaff(array $data)
{
    return User::create($data);
}
 
public function deleteStaff(int $id)
{
    $staff = $this->findStaffById($id);
    if ($staff->profile_url) {
        Storage::disk('private')->delete($staff->profile_url);
    }
    $staff->delete();
    return true;
}
 
public function updateStaffStatus(int $id, string $status)
{
    $staff = $this->findStaffById($id);
    $staff->update(['status' => $status]);
    return $staff;
}
public function createSubject(array $data){

    return SubjectModel::create($data);

}
 public function getAllSubjects(array $filters = [])
    {
        $query = SubjectModel::query();

        if (!empty($filters['department'])) {
            $query->where('department', $filters['department']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('subject', 'like', "%{$filters['search']}%")
                  ->orWhere('subject_code', 'like', "%{$filters['search']}%");
            });
        }

        // Add sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        
        return $query->orderBy($sortBy, $sortOrder)->get();
    }

    public function findSubjectById(int $id)
    {
        return SubjectModel::findOrFail($id);
    }

   

    public function updateSubject(int $id, array $data)
    {
        $subject = $this->findSubjectById($id);
        
        // Check for duplicate subject code if it's being updated
        if (isset($data['subject_code']) && $data['subject_code'] !== $subject->subject_code) {
            $existing = SubjectModel::where('subject_code', $data['subject_code'])
                ->where('id', '!=', $id)
                ->first();
            if ($existing) {
                throw new \Exception('Subject code already exists');
            }
        }

        $subject->update($data);
        return $subject;
    }

    public function deleteSubject(int $id)
    {
        $subject = $this->findSubjectById($id);
        
        // Check if subject is being used in schedules
        if ($subject->schedules()->exists()) {
            throw new \Exception('Cannot delete subject because it is being used in schedules');
        }

        $subject->delete();
        return true;
    }

    public function getSubjectsByDepartment(string $department)
    {
        return SubjectModel::where('department', $department)
            ->orderBy('subject_code')
            ->get();
    }

   public function getAllDepartments(array $filters = [])
{
    $query = DepartmentModel::query();

    if (!empty($filters['search'])) {
        $query->where(function ($q) use ($filters) {
            $q->where('degree_program', 'like', "%{$filters['search']}%")
              ->orWhere('college', 'like', "%{$filters['search']}%");
        });
    }

    return $query->latest()->get();
}

public function findDepartmentById(int $id)
{
    return DepartmentModel::findOrFail($id);
}

public function createDepartment(array $data)
{
    return DepartmentModel::create($data);
}

public function updateDepartment(int $id, array $data)
{
    $department = $this->findDepartmentById($id);
    $department->update($data);
    return $department;
}

public function deleteDepartment(int $id)
{
    $department = $this->findDepartmentById($id);
    return $department->delete();
}

public function logActivity(array $data)
    {
        return ActivityModel::create($data);
    }

    public function getRecentActivities(int $limit = 50, array $filters = [])
{
    $query = ActivityModel::query();

    if (!empty($filters['type'])) {
        $query->where('type', $filters['type']);
    }

    if (!empty($filters['device_id'])) {
        $query->where('device_id', $filters['device_id']);
    }

    if (!empty($filters['instructor_id'])) {
        $query->where('instructor_id', $filters['instructor_id']);
    }

    if (!empty($filters['staff_id'])) {
        $query->where('staff_id', $filters['staff_id']);
    }

    if (!empty($filters['from_date'])) {
        $query->whereDate('created_at', '>=', $filters['from_date']);
    }

    if (!empty($filters['to_date'])) {
        $query->whereDate('created_at', '<=', $filters['to_date']);
    }

    return $query->latest()->limit($limit)->get();
}

/**
 * Get activities by user
 */
public function getUserActivities(int $userId, int $limit = 50)
{
    return ActivityModel::where('user_id', $userId)
        ->orWhere('instructor_id', $userId)
        ->orWhere('staff_id', $userId)
        ->latest()
        ->limit($limit)
        ->get();
}

/**
 * Get activities by device
 */
public function getDeviceActivities(int $deviceId, int $limit = 50)
{
    return ActivityModel::where('device_id', $deviceId)
        ->latest()
        ->limit($limit)
        ->get();
}

/**
 * Get activities by type
 */
public function getActivitiesByType(string $type, int $limit = 50)
{
    return ActivityModel::where('type', $type)
        ->latest()
        ->limit($limit)
        ->get();
}

public function getAllScanLogs(array $filters = [])
{
    $query = DB::table('attendance_logs_db as a')
        ->leftJoin('schedule as s', 'a.schedule_id', '=', 's.id')
        ->select(
            'a.id',
            'a.date',
            'a.day',
            'a.subject',
            'a.code',
            'a.room',
            'a.time_in',
            'a.time_out',
            'a.status',
            'a.created_at',
            'a.instructor_id',
            's.block'
        );
    
    // Apply filters
    if (!empty($filters['from_date'])) {
        $query->where('a.date', '>=', $filters['from_date']);
    }
    
    if (!empty($filters['to_date'])) {
        $query->where('a.date', '<=', $filters['to_date']);
    }
    
    if (!empty($filters['status'])) {
        $query->where('a.status', $filters['status']);
    }
    
    return $query->orderBy('a.date', 'desc')->get();
}
public function updateStaff(int $id, array $data)
{
    $staff = $this->findStaffById($id);
    
    // Only update fields that are provided
    $updateData = [];
    if (isset($data['name'])) $updateData['name'] = $data['name'];
    if (isset($data['email'])) $updateData['email'] = $data['email'];
    if (isset($data['contact_no'])) $updateData['contact_no'] = $data['contact_no'];
    if (isset($data['address'])) $updateData['address'] = $data['address'];
    if (isset($data['gender'])) $updateData['gender'] = $data['gender'];
    if (isset($data['age'])) $updateData['age'] = $data['age'];
    if (isset($data['profile_url'])) $updateData['profile_url'] = $data['profile_url'];
    
    $staff->update($updateData);
    return $staff->fresh();
}


}