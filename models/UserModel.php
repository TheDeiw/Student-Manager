<?php
require_once 'db.php';

class UserModel
{
    private $pdo;

    public function __construct()
    {
        global $pdo;
        $this->pdo = $pdo;
    }

    public function authenticate($first_name, $last_name, $birthday)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM students WHERE first_name = ? AND last_name = ? AND birthday = ?");
        $stmt->execute([$first_name, $last_name, $birthday]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>