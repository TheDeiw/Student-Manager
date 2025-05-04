<?php
require_once 'models/UserModel.php';

class AuthController {
    private $model;
    
    public function __construct() {
        $this->model = new UserModel();
    }
    
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $login = $_POST['login'] ?? '';
            $birthday = $_POST['birthday'] ?? '';
            
            // Розділяємо ім'я та прізвище
            $parts = explode(' ', $login, 2);
            if (count($parts) !== 2) {
                echo json_encode(['success' => false, 'error' => 'Невірний формат логіну. Введіть "Ім\'я Прізвище"']);
                exit;
            }
            
            $first_name = $parts[0];
            $last_name = $parts[1];
            
            $user = $this->model->authenticate($first_name, $last_name, $birthday);
            
            if ($user) {
                $_SESSION['user'] = $user;
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Невірні дані для входу']);
            }
            exit;
        }
        
        // Якщо не POST запит, перенаправляємо на головну
        header('Location: index.php');
        exit;
    }
    
    public function logout() {
        session_start();
        session_destroy();
        header('Location: index.php');
        exit;
    }
}