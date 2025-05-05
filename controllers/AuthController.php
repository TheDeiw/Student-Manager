<?php
require_once 'models/UserModel.php';

class AuthController
{
    private $model;

    public function __construct()
    {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        $this->model = new UserModel();
        $this->cleanupExpiredSessions(); // Clean up expired sessions on initialization
    }

    public function login()
    {
        if (ob_get_length()) {
            ob_clean();
        }

        header('Content-Type: application/json');

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Невірний метод запиту']);
            exit;
        }

        $login = $_POST['login'] ?? '';
        $birthday = $_POST['password'] ?? '';

        $parts = explode(' ', trim($login), 2);
        if (count($parts) !== 2) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Невірний формат логіну. Введіть "Ім\'я Прізвище"']);
            exit;
        }

        $first_name = $parts[0];
        $last_name = $parts[1];

        try {
            $user = $this->model->authenticate($first_name, $last_name, $birthday);

            if ($user) {
                $_SESSION['user'] = $user;
                // Store session in the database
                $this->storeSession($user['id']);
                echo json_encode(['success' => true, 'message' => 'Успішний вхід', 'user' => $user]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Невірні дані для входу']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Помилка сервера: ' . $e->getMessage()]);
        }

        exit;
    }

    public function logout()
    {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }

        // Remove session from database
        if (isset($_SESSION['user']['id'])) {
            $this->removeSession($_SESSION['user']['id']);
        }

        $_SESSION = array();

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();

        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Успішний вихід']);
        exit;
    }

    public function getCurrentUser()
    {
        header('Content-Type: application/json');
        if (isset($_SESSION['user'])) {
            // Update last_active timestamp
            $this->updateSession($_SESSION['user']['id']);
            echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Не авторизовано']);
        }
        exit;
    }

    private function storeSession($student_id)
    {
        $session_id = session_id();
        $stmt = $this->model->getPdo()->prepare(
            "INSERT INTO sessions (session_id, student_id, created_at, last_active) 
             VALUES (?, ?, NOW(), NOW()) 
             ON DUPLICATE KEY UPDATE last_active = NOW()"
        );
        $stmt->execute([$session_id, $student_id]);
    }

    private function removeSession($student_id)
    {
        $session_id = session_id();
        $stmt = $this->model->getPdo()->prepare("DELETE FROM sessions WHERE session_id = ? OR student_id = ?");
        $stmt->execute([$session_id, $student_id]);
    }

    private function updateSession($student_id)
    {
        $session_id = session_id();
        $stmt = $this->model->getPdo()->prepare(
            "UPDATE sessions SET last_active = NOW() WHERE session_id = ? AND student_id = ?"
        );
        $stmt->execute([$session_id, $student_id]);
    }

    private function cleanupExpiredSessions()
    {
        // Remove sessions older than 30 minutes
        $stmt = $this->model->getPdo()->prepare(
            "DELETE FROM sessions WHERE last_active < NOW() - INTERVAL 30 MINUTE"
        );
        $stmt->execute();
    }
}