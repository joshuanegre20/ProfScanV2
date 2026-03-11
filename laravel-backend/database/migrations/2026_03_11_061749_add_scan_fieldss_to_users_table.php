<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('users', function (Blueprint $table) {
        if (!\Schema::hasColumn('users', 'last_scanned_at')) {
            $table->timestamp('last_scanned_at')->nullable()->after('scan_status');
        }
    });
}

public function down()
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['scan_status', 'last_scanned_at']);
    });
}
};
