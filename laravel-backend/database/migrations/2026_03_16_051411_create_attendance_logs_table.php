<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_logs_db', function (Blueprint $table) {
            $table->id();
            $table->string('instructor_id')->nullable();
            $table->integer('schedule_id')->nullable();
            $table->string('room')->nullable();
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();
            $table->date('date')->nullable();
            $table->string('status', 50)->default('Absent');
            $table->string('day', 20)->nullable();
            $table->string('subject')->nullable();
            $table->string('code', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_logs_db');
    }
};