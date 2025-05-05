<?php
require_once 'models/StudentModel.php';

class StudentController
{
    private $model;

    public function __construct()
    {
        $this->model = new StudentModel();
    }

    public function getStudents()
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $perPage = isset($_GET['perPage']) ? (int) $_GET['perPage'] : 5;

        if ($page < 1)
            $page = 1;
        if ($perPage < 1)
            $perPage = 5;

        $students = $this->model->getAllStudents($page, $perPage);
        $totalStudents = $this->model->getTotalStudents();
        $totalPages = ceil($totalStudents / $perPage);
        $isLoggedIn = isset($_SESSION['user']);

        header('Content-Type: application/json');
        echo json_encode([
            'students' => $students,
            'isLoggedIn' => $isLoggedIn,
            'pagination' => [
                'currentPage' => $page,
                'perPage' => $perPage,
                'totalPages' => $totalPages,
                'totalStudents' => $totalStudents
            ]
        ]);
        exit;
    }

    public function create()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $errors = $this->validateStudent($data);

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            exit;
        }

        if ($this->model->createStudent($data)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Не вдалося створити студента']);
        }
        exit;
    }

    public function edit($id)
    {
        $student = $this->model->getStudentById($id);
        if (!$student) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Student not found']);
            exit;
        }

        header('Content-Type: application/json');
        echo json_encode($student);
        exit;
    }

    public function update($data)
    {

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        $id = $data['id'] ?? 0;
        if (!$id || !$this->model->getStudentById($id)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Student not found']);
            exit;
        }

        $errors = $this->validateStudent($data, $id);

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            exit;
        }

        if ($this->model->updateStudent($id, $data)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Не вдалося оновити студента']);
        }
        exit;
    }

    public function delete($id)
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        if (!$id || !$this->model->getStudentById($id)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Student not found']);
            exit;
        }

        if ($this->model->deleteStudent($id)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Не вдалося видалити студента']);
        }
        exit;
    }

    public function deleteMultiple()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            exit;
        }

        $ids = isset($_POST['ids']) ? json_decode($_POST['ids'], true) : [];

        if (empty($ids)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No student IDs provided']);
            exit;
        }

        if ($this->model->deleteMultipleStudents($ids)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Не вдалося видалити студентів']);
        }
        exit;
    }

    private function validateStudent($data, $id = null)
    {
        $group = $data['group'] ?? '';
        $first_name = $data['first_name'] ?? '';
        $last_name = $data['last_name'] ?? '';
        $gender = $data['gender'] ?? '';
        $birthday = $data['birthday'] ?? '';

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
            $stmt = $this->model->getPdo()->prepare("SELECT COUNT(*) FROM students WHERE first_name = ? AND last_name = ? AND birthday = ? AND id != ?");
            $stmt->execute([$first_name, $last_name, $birthday, $id]);
        } else {
            $stmt = $this->model->getPdo()->prepare("SELECT COUNT(*) FROM students WHERE first_name = ? AND last_name = ? AND birthday = ?");
            $stmt->execute([$first_name, $last_name, $birthday]);
        }
        $count = $stmt->fetchColumn();
        if ($count > 0) {
            $errors[] = 'Student already exists';
        }

        return $errors;
    }
}