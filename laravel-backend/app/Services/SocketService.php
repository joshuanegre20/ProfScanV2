<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SocketService
{
    protected string $url;

    public function __construct()
    {
        $this->url = env('SOCKET_URL', 'http://profscan_socket:3001');
    }

    public function emitScan(array $data): void
    {
        $this->emit('/emit/scan', $data);
    }

    public function emitScheduleUpdate(array $data): void
    {
        $this->emit('/emit/schedule-update', $data);
    }

    public function emitAttendanceUpdate(array $data): void
    {
        $this->emit('/emit/attendance-update', $data);
    }

    public function emitEventUpdate(array $data): void
    {
        $this->emit('/emit/event-update', $data);
    }

    public function emitActivityUpdate(array $data): void
    {
        $this->emit('/emit/activity-update', $data);
    }

    private function emit(string $endpoint, array $data): void
    {
        try {
            Http::timeout(2)->post($this->url . $endpoint, $data);
        } catch (\Exception $e) {
            Log::warning("Socket emit failed [{$endpoint}]: " . $e->getMessage());
        }
    }
    public function emitDeviceUpdate(array $data): void
{
    $this->emit('/emit/device-update', $data);
}
}