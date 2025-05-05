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
    }

    public function login()
    {
        // Очищаємо буфер виводу, щоб уникнути зайвих символів
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
        $birthday = $_POST['password'] ?? ''; // Використовуємо 'password' як поле для дати народження

        // Розділяємо ім'я та прізвище
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
            echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Не авторизовано']);
        }
        exit;
    }
}
?>