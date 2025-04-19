<?php
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $group = $_POST['group'] ?? '';
    $first_name = $_POST['first_name'] ?? '';
    $last_name = $_POST['last_name'] ?? '';
    $gender = $_POST['gender'] ?? '';
    $birthday = $_POST['birthday'] ?? '';

    $errors = [];

    if ($id <= 0) $errors[] = 'Invalid student ID';
    if (empty($group)) $errors[] = 'Group is required';
    if (empty($first_name)) $errors[] = 'First name is required';
    if (empty($last_name)) $errors[] = 'Last name is required';
    if (empty($gender) || !in_array($gender, ['M', 'F'])) $errors[] = 'Invalid gender';
    if (empty($birthday)) $errors[] = 'Birthday is required';

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE students SET group_name = ?, first_name = ?, last_name = ?, gender = ?, birthday = ? WHERE id = ?");
        $stmt->execute([$group, $first_name, $last_name, $gender, $birthday, $id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update student']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
?>