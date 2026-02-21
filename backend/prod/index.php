<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = getenv('DB_HOST') ?: 'db';
$db_name = getenv('DB_NAME') ?: 'findb';
$username = getenv('DB_USER') ?: 'user';
$password = getenv('DB_PASS') ?: 'password';

try {
    $conn = new PDO("mysql:host={$host};dbname={$db_name}", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de conexión: " . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->query("SELECT * FROM transactions ORDER BY created_at DESC");
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($transactions);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if(isset($data->description) && isset($data->amount) && isset($data->type)) {
        $stmt = $conn->prepare("INSERT INTO transactions (description, amount, type) VALUES (?, ?, ?)");
        $stmt->execute([$data->description, $data->amount, $data->type]);
        http_response_code(201);
        echo json_encode(["message" => "Transacción creada", "id" => $conn->lastInsertId()]);
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Datos incompletos"]);
    }
}
?>
