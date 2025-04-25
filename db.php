<?php
$host = 'localhost';
$dbname = 'student_manager';
$username = 'root'; // За замовчуванням у XAMPP
$password = '';     // За замовчуванням у XAMPP

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>