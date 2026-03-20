<?php

namespace App\Services;

use App\Repository\RepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class Services
{
    public function __construct(
        protected RepositoryInterface $instructorRepository
    ) {}

    public function getAll(array $filters = [])
    {
        return $this->instructorRepository->getAll($filters);
    }

    public function findById(int $id)
    {
        return $this->instructorRepository->findById($id);
    }

    public function create(array $data, $photo = null)
    {
        $data['password'] = Hash::make($data['password']);
        $data['role']     = 'instructor';
        $data['status']   = 'Active';

        if ($photo) {
            $data['profile_url'] = $photo->store('instructors', 'private');
        }

        $instructor = $this->instructorRepository->create($data);
        
        // Log activity for instructor creation
        $this->logActivity([
            'type' => 'create',
            'name' => $instructor->name,
            'instructor_id' => $instructor->instructor_id,
            'college' => $instructor->department,
            'description' => "New instructor created: {$instructor->name}"
        ]);
        
        return $instructor;
    }

    public function update(int $id, array $data, $photo = null)
    {
        $oldInstructor = $this->instructorRepository->findById($id);
        
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if ($photo) {
            $instructor = $this->instructorRepository->findById($id);
            if ($instructor->profile_url) {
                Storage::disk('private')->delete($instructor->profile_url);
            }
            $data['profile_url'] = $photo->store('instructors', 'private');
        }

        $instructor = $this->instructorRepository->update($id, $data);
        
        // Log activity for instructor update
        $this->logActivity([
            'type' => 'update',
            'name' => $instructor->name,
            'instructor_id' => $instructor->instructor_id,
            'college' => $instructor->department,
            'description' => "Instructor updated: {$instructor->name}"
        ]);
        
        return $instructor;
    }

    public function delete(int $id)
    {
        $instructor = $this->instructorRepository->findById($id);
        
        // Log activity before deletion
        $this->logActivity([
            'type' => 'delete',
            'name' => $instructor->name,
            'instructor_id' => $instructor->instructor_id,
            'college' => $instructor->department,
            'description' => "Instructor deleted: {$instructor->name}"
        ]);
        
        if ($instructor->profile_url) {
            Storage::disk('private')->delete($instructor->profile_url);
        }
        return $this->instructorRepository->delete($id);
    }

    public function updateStatus(int $id, string $status)
    {
        $instructor = $this->instructorRepository->updateStatus($id, $status);
        
        // Log activity for status change
        $this->logActivity([
            'type' => 'status_change',
            'name' => $instructor->name,
            'instructor_id' => $instructor->instructor_id,
            'college' => $instructor->department,
            'description' => "Instructor status changed to {$status}: {$instructor->name}"
        ]);
        
        return $instructor;
    }

    public function getEvents(array $filters = [])
    {
        return $this->instructorRepository->getEvents($filters);
    }

    public function getEvent(int $id)
    {
        return $this->instructorRepository->getEvent($id);
    }

    public function addEvents(array $data)
    {
        $event = $this->instructorRepository->addEvents($data);
        
        // Log activity for event creation
        $this->logActivity([
            'type' => 'event_create',
            'name' => $data['title'] ?? 'Event',
            'description' => "New event created: {$data['title']}"
        ]);
        
        return $event;
    }

    public function updateEvent(int $id, array $data)
    {
        $event = $this->instructorRepository->updateEvent($id, $data);
        
        // Log activity for event update
        $this->logActivity([
            'type' => 'event_update',
            'name' => $event->title,
            'description' => "Event updated: {$event->title}"
        ]);
        
        return $event;
    }

    public function deleteEvent(int $id)
    {
        $event = $this->instructorRepository->getEvent($id);
        
        // Log activity for event deletion
        $this->logActivity([
            'type' => 'event_delete',
            'name' => $event->title,
            'description' => "Event deleted: {$event->title}"
        ]);
        
        return $this->instructorRepository->deleteEvent($id);
    }

    public function addSchedule(array $data)
    {
        $schedule = $this->instructorRepository->addSchedule($data);
        
        // Log activity for schedule creation
        $this->logActivity([
            'type' => 'schedule_create',
            'name' => $data['name'] ?? 'Schedule',
            'instructor_id' => $data['instructor_id'] ?? null,
            'subject' => $data['subject'] ?? null,
            'device_id' => $data['device_id'] ?? null,
            'description' => "New schedule created for: {$data['name']} - {$data['subject']}"
        ]);
        
        return $schedule;
    }

    public function getSchedules(array $filters = [])
    {
        return $this->instructorRepository->getSchedules($filters);
    }
    
    public function deleteSchedule(int $id)
    {
        $schedule = $this->instructorRepository->getSchedule($id);
        
        // Log activity for schedule deletion
        $this->logActivity([
            'type' => 'schedule_delete',
            'name' => $schedule->name,
            'instructor_id' => $schedule->instructor_id,
            'subject' => $schedule->subject,
            'device_id' => $schedule->device_id,
            'description' => "Schedule deleted for: {$schedule->name} - {$schedule->subject}"
        ]);
        
        return $this->instructorRepository->deleteSchedule($id);
    }

    public function getAdmin(int $id)
    {
        return $this->instructorRepository->updateById($id, []);
    }

    public function changePassword(int $id, string $newPassword)
    {
        $user = $this->instructorRepository->updateById($id, [
            'password' => Hash::make($newPassword),
        ]);
        
        // Log activity for password change
        $this->logActivity([
            'type' => 'security_change',
            'name' => $user->name,
            'description' => "Password changed for user: {$user->name}"
        ]);
        
        return $user;
    }

    public function updateAdmin(int $id, array $data)
    {
        $user = $this->instructorRepository->updateById($id, $data);
        
        // Log activity for admin profile update
        $this->logActivity([
            'type' => 'profile_update',
            'name' => $user->name,
            'description' => "Profile updated for: {$user->name}"
        ]);
        
        return $user;
    }
    
    public function getAllStaff(array $filters = [])
    {
        return $this->instructorRepository->getAllStaff($filters);
    }
 
    public function createStaff(array $data, $photo = null)
    {
        $data['password'] = Hash::make($data['password']);
        $data['role']     = 'staff';
        $data['status']   = 'Active';
 
        if ($photo) {
            $data['profile_url'] = $photo->store('staff', 'private');
        }
 
        $staff = $this->instructorRepository->createStaff($data);
        
        // Log activity for staff creation
        $this->logActivity([
            'type' => 'staff_create',
            'name' => $staff->name,
            'staff_id' => $staff->staff_id,
            'description' => "New staff created: {$staff->name}"
        ]);
        
        return $staff;
    }
 
    public function deleteStaff(int $id)
    {
        $staff = $this->instructorRepository->findStaffById($id);
        
        // Log activity for staff deletion
        $this->logActivity([
            'type' => 'staff_delete',
            'name' => $staff->name,
            'staff_id' => $staff->staff_id,
            'description' => "Staff deleted: {$staff->name}"
        ]);
        
        return $this->instructorRepository->deleteStaff($id);
    }
 
    public function updateStaffStatus(int $id, string $status)
    {
        $staff = $this->instructorRepository->updateStaffStatus($id, $status);
        
        // Log activity for staff status change
        $this->logActivity([
            'type' => 'staff_status_change',
            'name' => $staff->name,
            'staff_id' => $staff->staff_id,
            'description' => "Staff status changed to {$status}: {$staff->name}"
        ]);
        
        return $staff;
    }

    public function createSubject(array $data)
    {
        $subject = $this->instructorRepository->createSubject($data);
        
        // Log activity for subject creation
        $this->logActivity([
            'type' => 'subject_create',
            'name' => $data['subject'] ?? 'Subject',
            'subject' => $data['subject'] ?? null,
            'college' => $data['department'] ?? null,
            'description' => "New subject created: {$data['subject_code']} - {$data['subject']}"
        ]);
        
        return $subject;
    }
    
    public function getAllSubjects(array $filters = [])
    {
        return $this->instructorRepository->getAllSubjects($filters);
    }

    public function getSubjectById(int $id)
    {
        return $this->instructorRepository->findSubjectById($id);
    }
   
    public function updateSubject(int $id, array $data)
    {
        $subject = $this->instructorRepository->updateSubject($id, $data);
        
        // Log activity for subject update
        $this->logActivity([
            'type' => 'subject_update',
            'name' => $subject->subject,
            'subject' => $subject->subject,
            'college' => $subject->department,
            'description' => "Subject updated: {$subject->subject_code} - {$subject->subject}"
        ]);
        
        return $subject;
    }

    public function deleteSubject(int $id)
    {
        $subject = $this->instructorRepository->findSubjectById($id);
        
        // Log activity for subject deletion
        $this->logActivity([
            'type' => 'subject_delete',
            'name' => $subject->subject,
            'subject' => $subject->subject,
            'college' => $subject->department,
            'description' => "Subject deleted: {$subject->subject_code} - {$subject->subject}"
        ]);
        
        return $this->instructorRepository->deleteSubject($id);
    }

    public function getSubjectsByDepartment(string $department)
    {
        return $this->instructorRepository->getSubjectsByDepartment($department);
    }
    
    public function getAllDepartments(array $filters = [])
    {
        return $this->instructorRepository->getAllDepartments($filters);
    }

    public function getDepartmentById(int $id)
    {
        return $this->instructorRepository->findDepartmentById($id);
    }

    public function createDepartment(array $data)
    {
        $department = $this->instructorRepository->createDepartment($data);
        
        // Log activity for department creation
        $this->logActivity([
            'type' => 'department_create',
            'name' => $data['degree_program'] ?? 'Department',
            'college' => $data['college'] ?? null,
            'description' => "New department created: {$data['degree_program']} - {$data['college']}"
        ]);
        
        return $department;
    }

    public function updateDepartment(int $id, array $data)
    {
        $department = $this->instructorRepository->updateDepartment($id, $data);
        
        // Log activity for department update
        $this->logActivity([
            'type' => 'department_update',
            'name' => $department->degree_program,
            'college' => $department->college,
            'description' => "Department updated: {$department->degree_program}"
        ]);
        
        return $department;
    }

    public function deleteDepartment(int $id)
    {
        $department = $this->instructorRepository->findDepartmentById($id);
        
        // Log activity for department deletion
        $this->logActivity([
            'type' => 'department_delete',
            'name' => $department->degree_program,
            'college' => $department->college,
            'description' => "Department deleted: {$department->degree_program} - {$department->college}"
        ]);
        
        return $this->instructorRepository->deleteDepartment($id);
    }

    /**
     * Log an activity to the database
     */
    private function logActivity(array $data)
    {
        // Get current authenticated user if available
        $user = auth()->user();
        
        $activityData = [
            'type' => $data['type'] ?? 'activity',
            'name' => $data['name'] ?? 'System',
            'description' => $data['description'] ?? 'Activity performed',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ];
        
        // Add optional fields if they exist
        if (isset($data['instructor_id'])) {
            $activityData['instructor_id'] = $data['instructor_id'];
        }
        
        if (isset($data['staff_id'])) {
            $activityData['staff_id'] = $data['staff_id'];
        }
        
        if (isset($data['college'])) {
            $activityData['college'] = $data['college'];
        }
        
        if (isset($data['subject'])) {
            $activityData['subject'] = $data['subject'];
        }
        
        if (isset($data['scan_schedule'])) {
            $activityData['scan_schedule'] = $data['scan_schedule'];
        }
        
        if (isset($data['device_id'])) {
            $activityData['device_id'] = $data['device_id'];
        }
        
        // Add user_id if authenticated
        if ($user) {
            $activityData['user_id'] = $user->id;
            if (empty($activityData['name'])) {
                $activityData['name'] = $user->name;
            }
        }
        
        return $this->instructorRepository->logActivity($activityData);
    }


    public function updateSchedule(int $id, array $data)
{
    return $this->instructorRepository->updateSchedule($id, $data);
}

/**
 * Get a single schedule by ID
 */
public function getSchedule(int $id)
{
    return $this->instructorRepository->getSchedule($id);
}
     public function getRecentActivities(int $limit = 50, array $filters = [])
    {
        return $this->instructorRepository->getRecentActivities($limit, $filters);
    }

    /**
     * Get activities by device
     */
    public function getDeviceActivities(int $deviceId, int $limit = 50)
    {
        return $this->instructorRepository->getDeviceActivities($deviceId, $limit);
    }

    /**
     * Get activities by user
     */
    public function getUserActivities(int $userId, int $limit = 50)
    {
        return $this->instructorRepository->getUserActivities($userId, $limit);
    }

    /**
     * Get activities by type
     */
    public function getActivitiesByType(string $type, int $limit = 50)
    {
        return $this->instructorRepository->getActivitiesByType($type, $limit);
    }
}