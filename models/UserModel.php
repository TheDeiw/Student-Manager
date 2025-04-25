<?php
require_once './db.php';

class UserModel {
    private $pdo;

    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
    }

    public function authenticate($username, $password) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
        $stmt->execute([$username, md5($password)]); // У продакшені використовуй безпечне хешування
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>