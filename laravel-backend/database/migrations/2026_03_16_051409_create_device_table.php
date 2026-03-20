<?php

// ── database/migrations/xxxx_create_devices_table.php ─────────────

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('pairing_token')->unique();   // generated on create
            $table->string('chip_id')->nullable();       // filled by ESP32 on register
            $table->string('mac_address')->nullable();   // filled by ESP32 on register
            $table->string('wifi_ssid')->nullable();
            $table->string('wifi_password')->nullable();
            $table->string('server_url')->nullable();
            $table->integer('scan_cooldown')->default(3000);
            $table->boolean('paired')->default(false);
            $table->string('status')->default('offline'); // online | offline
            $table->timestamp('last_seen')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};