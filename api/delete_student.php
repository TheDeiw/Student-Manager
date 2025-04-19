<?php
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;

    // Валідація ID
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid student ID']);
        exit;
    }

    try {
        // Перевірка, чи існує студент із таким ID
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE id = ?");
        $stmt->execute([$id]);
        $count = $stmt->fetchColumn();

        if ($count === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Student not found']);
            exit;
        }

        // Видалення студента
        $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
        $stmt->execute([$id]);

        // Успішна відповідь
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to delete student: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
?>