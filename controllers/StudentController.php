<?php
require_once './models/StudentModel.php';

class StudentController {
    private $model;

    public function __construct() {
        $this->model = new StudentModel();
    }

    public function index() {
        $students = $this->model->getAllStudents();
        require_once './views/pages/students.php';
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = $_POST;
            if ($this->model->createStudent($data)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Не вдалося створити студента']);
            }
        }
    }

    public function edit($id) {
        $student = $this->model->getStudentById($id);
        require_once './views/pages/edit_student.php';
    }

    public function update($data) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id = $data['id'] ?? 0;
            if ($this->model->updateStudent($id, $data)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Не вдалося оновити студента']);
            }
        }
    }

    public function delete($id) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if ($this->model->deleteStudent($id)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Не вдалося видалити студента']);
            }
        }
    }
}
?>