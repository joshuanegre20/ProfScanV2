<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repository\Repository;
use App\Repository\RepositoryInterface;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
        $this->app->bind(
        RepositoryInterface::class,
        Repository::class,
    );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
