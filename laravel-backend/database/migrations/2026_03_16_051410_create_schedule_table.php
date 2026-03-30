<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Must run after devices table exists
        Schema::create('schedule', function (Blueprint $table) {
            $table->id();
            $table->string('instructor_id');
            $table->string('name');
            $table->string('subject');
            $table->string('subject_code');
            $table->string('time');
            $table->time('end_time');
            $table->string('day');
            $table->string('status');
            $table->string('room')->nullable();
            $table->unsignedBigInteger('device_id')->nullable();
            $table->string('attendance')->default('Absent');
            $table->timestamp('scanned_at')->nullable();
            $table->timestamps();

            $table->foreign('device_id')
                  ->references('id')->on('devices')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule');
    }
};