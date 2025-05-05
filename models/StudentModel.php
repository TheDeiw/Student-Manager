<?php
require_once './db.php';

class StudentModel {
    private $pdo;

    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
    }

    public function getPdo() {
        return $this->pdo;
    }

    public function getAllStudents($page = 1, $perPage = 5) {
        $offset = ($page - 1) * $perPage;
        $stmt = $this->pdo->prepare("SELECT * FROM students LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTotalStudents() {
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM students");
        return $stmt->fetchColumn();
    }

    public function getStudentById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM students WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createStudent($data) {
        $stmt = $this->pdo->prepare("INSERT INTO students (group_name, first_name, last_name, gender, birthday) VALUES (?, ?, ?, ?, ?)");
        return $stmt->execute([$data['group'], $data['first_name'], $data['last_name'], $data['gender'], $data['birthday']]);
    }

    public function updateStudent($id, $data) {
        $stmt = $this->pdo->prepare("UPDATE students SET group_name = ?, first_name = ?, last_name = ?, gender = ?, birthday = ? WHERE id = ?");
        return $stmt->execute([$data['group'], $data['first_name'], $data['last_name'], $data['gender'], $data['birthday'], $id]);
    }

    public function deleteStudent($id) {
        $stmt = $this->pdo->prepare("DELETE FROM students WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function deleteMultipleStudents($ids) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare("DELETE FROM students WHERE id IN ($placeholders)");
        return $stmt->execute($ids);
    }
}