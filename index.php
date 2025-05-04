<?php
session_start();
require_once 'controllers/AuthController.php';
require_once 'controllers/StudentController.php';

$action = $_GET['action'] ?? 'index';

if ($action === 'login') {
    $authController = new AuthController();
    $authController->login();
} else if ($action === 'logout') {
    $authController = new AuthController();
    $authController->logout();
} else {
    $controller = new StudentController();
    
    switch ($action) {
        case 'index':
            $controller->index();
            break;
        case 'getStudents':
            $controller->getStudents();
            break;
        case 'create':
            $controller->create();
            break;
        case 'edit':
            $id = $_GET['id'] ?? 0;
            $controller->edit($id);
            break;
        case 'update':
            $controller->update($_POST);
            break;
        case 'delete':
            $controller->delete($_POST['id'] ?? 0);
            break;
        case 'deleteMultiple':
            $controller->deleteMultiple();
            break;
        default:
            $controller->index();
            break;
    }
}