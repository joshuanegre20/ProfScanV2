<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('instructor_id')->nullable();
            $table->string('staff_id')->nullable();
            $table->string('name');
            $table->string('type');
            $table->string('college')->nullable();
            $table->string('subject')->nullable();
            $table->string('scanned_schedule')-> nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scan_activity');
    }
};
