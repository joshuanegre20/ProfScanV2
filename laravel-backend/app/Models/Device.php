<?php

// ── app/Models/Device.php ─────────────────────────────────────────

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $fillable = [
        'name',
        'pairing_token',
        'chip_id',
        'mac_address',
        'wifi_ssid',
        'wifi_password',
        'server_url',
        'scan_cooldown',
        'paired',
        'status',
        'last_seen',
        'device_id',
    ];

    protected $casts = [
        'paired'    => 'boolean',
        'last_seen' => 'datetime',
    ];

    // Mark device as online (call this on every heartbeat/scan)
    public function markOnline(): void
    {
        $this->update([
            'status'    => 'online',
            'last_seen' => now(),
        ]);
    }
}