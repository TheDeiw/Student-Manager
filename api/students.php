<?php
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get POST data, set id to null if not provided or empty
    $id = isset($_POST['id']) && $_POST['id'] !== '' ? intval($_POST['id']) : null;
    $group = $_POST['group'] ?? '';
    $first_name = $_POST['first_name'] ?? '';
    $last_name = $_POST['last_name'] ?? '';
    $gender = $_POST['gender'] ?? '';
    $birthday = $_POST['birthday'] ?? '';

    // Array to store validation errors
    $errors = [];

    // Validate group
    if (empty($group)) {
        $errors[] = 'Group is required';
    }

    // Validate first name
    if (empty($first_name)) {
        $errors[] = 'First name is required';
    } elseif (strlen($first_name) < 2 || strlen($first_name) > 50) {
        $errors[] = 'First name must be between 2 and 50 characters';
    } elseif (!preg_match('/^[A-ZА-ЯЁІЇЄ]/u', $first_name)) {
        $errors[] = 'First name must start with an uppercase letter';
    } elseif (!preg_match('/^[A-Za-zА-Яа-яЁёІіЇїЄє-]+$/u', $first_name)) {
        $errors[] = 'First name can only contain letters';
    }

    // Validate last name
    if (empty($last_name)) {
        $errors[] = 'Last name is required';
    } elseif (strlen($last_name) < 2 || strlen($last_name) > 50) {
        $errors[] = 'Last name must be between 2 and 50 characters';
    } elseif (!preg_match('/^[A-ZА-ЯЁІЇЄ]/u', $last_name)) {
        $errors[] = 'Last name must start with an uppercase letter';
    } elseif (!preg_match('/^[A-Za-zА-Яа-яЁёІіЇїЄє-]+$/u', $last_name)) {
        $errors[] = 'Last name can only contain letters';
    }

    // Validate gender
    if (empty($gender)) {
        $errors[] = 'Gender is required';
    } elseif (!in_array($gender, ['M', 'F'])) {
        $errors[] = 'Invalid gender';
    }

    // Validate birthday
    if (empty($birthday)) {
        $errors[] = 'Birthday is required';
    } else {
        $birthday_date = new DateTime($birthday);
        $today = new DateTime();
        $age = $today->diff($birthday_date)->y;
        if ($age < 18 || $age > 100) {
            $errors[] = 'Age must be between 18 and 100';
        }
    }

    // Check for duplicates
    if ($id) {
        // For update: exclude the current student
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE first_name = ? AND last_name = ? AND birthday = ? AND id != ?");
        $stmt->execute([$first_name, $last_name, $birthday, $id]);
    } else {
        // For insert: check if any student exists with these details
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE first_name = ? AND last_name = ? AND birthday = ?");
        $stmt->execute([$first_name, $last_name, $birthday]);
    }
    $count = $stmt->fetchColumn();
    if ($count > 0) {
        $errors[] = 'Student already exists';
    }

    // If there are errors, return them
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        exit;
    }

    try {
        if ($id) {
            // Update existing student
            $stmt = $pdo->prepare("UPDATE students SET group_name = ?, first_name = ?, last_name = ?, gender = ?, birthday = ? WHERE id = ?");
            $stmt->execute([$group, $first_name, $last_name, $gender, $birthday, $id]);
        } else {
            // Insert new student
            $stmt = $pdo->prepare("INSERT INTO students (group_name, first_name, last_name, gender, birthday) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$group, $first_name, $last_name, $gender, $birthday]);
        }
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save student']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
?>