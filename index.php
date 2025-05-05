<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once './controllers/StudentController.php';
require_once './controllers/AuthController.php';

$requestMethod = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '/';

try {
	$studentController = new StudentController();
	$authController = new AuthController();

	if (strpos($path, '/api/students') === 0) {
		if ($path === '/api/students' && $requestMethod === 'GET') {
			$studentController->getStudents();
		} elseif (preg_match('#^/api/students/(\d+)$#', $path, $matches) && $requestMethod === 'GET') {
			$id = $matches[1];
			$studentController->edit($id);
		} elseif ($path === '/api/students' && $requestMethod === 'POST') {
			$studentController->create();
			// $action = $_POST['action'] ?? '';
			// if ($action === 'create') {

			// } elseif ($action === 'update') {
			// 	$data = $_POST;
			// 	$studentController->update($data);
			// } elseif ($action === 'delete') {
			// 	$id = $_POST['id'] ?? 0;
			// 	$studentController->delete($id);
			// } elseif ($action === 'deleteMultiple') {
			// 	$studentController->deleteMultiple();
			// } else {
			// 	http_response_code(400);
			// 	echo json_encode(['success' => false, 'error' => 'Invalid action']);
			// }
		} else {
			http_response_code(404);
			echo json_encode(['success' => false, 'error' => 'Not found']);
		}
	} elseif (strpos($path, '/api/auth') === 0) {
		if ($path === '/api/auth/login' && $requestMethod === 'POST') {
			$authController->login();
		} elseif ($path === '/api/auth/logout' && $requestMethod === 'POST') {
			$authController->logout();
		} else {
			http_response_code(404);
			echo json_encode(['success' => false, 'error' => 'Not found']);
		}
	} else {
		http_response_code(404);
		echo json_encode(['success' => false, 'error' => 'Not found']);
	}
} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>