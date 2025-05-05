<?php
$host = 'localhost';
$dbname = 'student_manager';
$username = 'root'; // Default for XAMPP
$password = '';     // Default for XAMPP

function getDatabaseConnection()
{
    global $host, $dbname, $username, $password;
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Fetch as associative arrays
        $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // Use real prepared statements
        $pdo->setAttribute(PDO::ATTR_PERSISTENT, false); // Disable persistent connections for simplicity
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage()); // Log error
        die("Connection failed. Please check the server logs for details.");
    }
}

// Make PDO globally available (optional, for existing code compatibility)
$pdo = getDatabaseConnection();
?>