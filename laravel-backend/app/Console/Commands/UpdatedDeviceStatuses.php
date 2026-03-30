<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Services\SocketService;

class UpdateDeviceStatuses extends Command
{
    protected $signature   = 'devices:update-statuses';
    protected $description = 'Mark devices offline if no heartbeat received in 35 seconds';

    public function handle()
    {
        $socket = new SocketService();

        $offlineDevices = DB::table('devices')
            ->where('status', 'online')
            ->where('last_seen', '<', now()->subSeconds(5))
            ->get();

        foreach ($offlineDevices as $device) {
            DB::table('devices')
                ->where('id', $device->id)
                ->update(['status' => 'offline']);

            // ── Emit device-update to admin dashboard ─────────────
            $socket->emitDeviceUpdate([
                'device_id' => $device->id,
                'name'      => $device->name,
                'status'    => 'offline',
                'last_seen' => $device->last_seen,
            ]);
        }

        $count = count($offlineDevices);
        if ($count > 0) {
            $this->info("Marked {$count} device(s) offline");
            \Log::info("devices:update-statuses — {$count} offline at " . now()->format('H:i:s'));
        }

        return 0;
    }
}