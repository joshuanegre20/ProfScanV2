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
}