<?php

namespace App\Repository;

interface RepositoryInterface
{
    public function getAll(array $filters = []);
    public function findById(int $id);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
    public function updateStatus(int $id, string $status);
    public function getEvents(array $filters = []);
    public function addEvents(array $data);
    public function getEvent(int $id);
    public function updateEvent(int $id, array $data);
    public function deleteEvent(int $id);
    public function getSchedules(array $filters = []);
public function getSchedule(int $id);
public function updateSchedule(int $id, array $data);
public function deleteSchedule(int $id);
public function updateById(int $id, array $data): mixed;
public function getAllStaff(array $filters = []);
    public function findStaffById(int $id);
    public function createStaff(array $data);
    public function deleteStaff(int $id);
    public function updateStaffStatus(int $id, string $status);

    public function createSubject(array $data);
     public function findSubjectById(int $id);
    
    public function updateSubject(int $id, array $data);
    public function deleteSubject(int $id);
    public function getSubjectsByDepartment(string $department);

   
    public function getAllDepartments(array $filters = []);
public function findDepartmentById(int $id);
public function createDepartment(array $data);
public function updateDepartment(int $id, array $data);
public function deleteDepartment(int $id);

public function logActivity(array $data);
 public function getRecentActivities(int $limit = 50, array $filters = []);
    public function getUserActivities(int $userId, int $limit = 50);
    public function getDeviceActivities(int $deviceId, int $limit = 50);
    public function getActivitiesByType(string $type, int $limit = 50);
    public function getAllScanLogs(array $filters = []);
   public function updateStaff(int $id, array $data);

}