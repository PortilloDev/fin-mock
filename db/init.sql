CREATE DATABASE IF NOT EXISTS findb;
USE findb;

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO transactions (description, amount, type) VALUES 
('Sueldo', 2500.00, 'income'),
('Cursor', 45.50, 'expense'),
('Restaurante', 12.00, 'expense');
