FROM php:8.2-cli

# System dependencies
RUN apt-get update && apt-get install -y \
    git curl zip unzip \
    libpng-dev libonig-dev libxml2-dev libzip-dev \
    && docker-php-ext-install \
        pdo pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Install dependencies first (better layer caching)
COPY laravel-backend/composer.json laravel-backend/composer.lock ./
RUN composer install \
    --no-scripts \
    --no-autoloader \
    --no-dev \
    --prefer-dist

# Copy Laravel app
COPY laravel-backend/ .

# Optimize
RUN composer dump-autoload --optimize \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]