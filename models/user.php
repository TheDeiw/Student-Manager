<?php
require_once __DIR__ . '/../api/db.php';

class User {
    private $conn;

    public function __construct() {
        global $pdo;
        $this->conn = $pdo;
    }

    public function authenticate($username, $password) {
        $query = "SELECT id, first_name, last_name, birthday AS password FROM students WHERE CONCAT(first_name, ' ', last_name) = :username AND birthday = :password";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password', $password);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            return ['id' => $user['id'], 'username' => $username];
        }
        return false;
    }
}
?>