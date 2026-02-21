<?php
// Configuración centralizada de la base de datos
return [
    'host'     => getenv('DB_HOST') ?: 'db',
    'dbname'   => getenv('DB_NAME') ?: 'findb',
    'username' => getenv('DB_USER') ?: 'user',
    'password' => getenv('DB_PASS') ?: 'password',
];
?>
