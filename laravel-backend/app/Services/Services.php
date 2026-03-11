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

        return $this->instructorRepository->create($data);
    }

    public function update(int $id, array $data, $photo = null)
    {
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

        return $this->instructorRepository->update($id, $data);
    }

    public function delete(int $id)
    {
        $instructor = $this->instructorRepository->findById($id);
        if ($instructor->profile_url) {
            Storage::disk('private')->delete($instructor->profile_url);
        }
        return $this->instructorRepository->delete($id);
    }

    public function updateStatus(int $id, string $status)
    {
        return $this->instructorRepository->updateStatus($id, $status);
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
        return $this->instructorRepository->addEvents($data);
    }

    public function updateEvent(int $id, array $data)
    {
        return $this->instructorRepository->updateEvent($id, $data);
    }

    public function deleteEvent(int $id)
    {
        return $this->instructorRepository->deleteEvent($id);
    }

    public function addSchedule(array $data)
    {
        return $this->instructorRepository->addSchedule($data);
    }

    public function getSchedules(array $filters = [])
    {
        return $this->instructorRepository->getSchedules($filters);
    }

    public function getAdmin(int $id)
    {
        return $this->instructorRepository->updateById($id, []);
    }

    public function changePassword(int $id, string $newPassword)
    {
        return $this->instructorRepository->updateById($id, [  // ← updateById not update
            'password' => Hash::make($newPassword),
        ]);
    }

    public function updateAdmin(int $id, array $data)
    {
        return $this->instructorRepository->updateById($id, $data);  // ← updateById not update
    }
}