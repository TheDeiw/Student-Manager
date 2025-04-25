<?php
session_start();
require_once 'controllers/AuthController.php';
require_once 'controllers/StudentController.php';

$controller = new StudentController();
$action = $_GET['action'] ?? 'index';

switch ($action) {
    case 'index':
        $controller->index();
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
    default:
        $controller->index();
        break;
}
?>