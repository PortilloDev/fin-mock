FROM php:8.2-apache

# Instalar extensión mysqli y pdo_mysql
RUN docker-php-ext-install pdo pdo_mysql

# Habilitar mod_rewrite si fuera necesario
RUN a2enmod rewrite

# Copiar el código fuente
COPY . /var/www/html/

# Configurar permisos
RUN chown -R www-data:www-data /var/www/html
