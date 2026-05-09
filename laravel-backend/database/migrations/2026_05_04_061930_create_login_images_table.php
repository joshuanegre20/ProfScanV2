<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_login_images_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLoginImagesTable extends Migration
{
    public function up()
    {
        Schema::create('login_images', function (Blueprint $table) {
            $table->id();
            $table->string('image_path');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('login_images');
    }
}