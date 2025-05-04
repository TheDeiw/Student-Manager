<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Student-Manager</title>
    <link rel="stylesheet" href="./css/style.css">
    <link rel="stylesheet" href="./css/forms.css">
    <link rel="stylesheet" href="./css/adaptability.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
    <link rel="shortcut icon" type="image/x-icon" href="./assets/favicon/favicon.ico">
</head>
<body>
    <?php include './views/layouts/header.php'; ?>
    <main class="wrapper">
        <?php include './views/layouts/sidemenu.php'; ?>
        <section class="student_table">
            <div class="student_table__control">
                <div class="table__describe">
                    <h2 class="describe__heading">Students</h2>
                    <p class="descpibe__paragraph">Here you can manage all data about students</p>
                </div>
                <div class="table__control_buttons">
                    <button class="table__add_student <?php echo !isset($_SESSION['user']) ? 'disabled' : ''; ?>" onclick="openAddForm()">
                        <img class="add_student_plus" src="./assets/img/students-table/plus.svg" alt="Plus sign for adding button">
                        <p class="add_student_describe">Add Student</p>
                    </button>
                    <button class="table__delete_student <?php echo !isset($_SESSION['user']) ? 'disabled' : ''; ?>" onclick="openDeleteForm()">
                        <p class="delete_student_describe">Delete (0)</p>
                    </button>
                </div>
            </div>
            <table class="main_table">
                <thead>
                    <tr>
                        <th><input type="checkbox" aria-label="Вибрати всіх"></th>
                        <th>Група</th>
                        <th>Ім'я</th>
                        <th>Стать</th>
                        <th>Дата народження</th>
                        <th>Статус</th>
                        <th>Опції</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Таблиця заповнюється через JavaScript -->
                </tbody>
            </table>
            <div class="pagination">
                <ul class="pagination__list">
                    <li class="pagination_list__item"><button class="item__content" aria-label="Previous page in table">Prev</button></li>
                    <li class="pagination_list__item"><button class="item__content">1</button></li>
                    <li class="pagination_list__item"><button class="item__content">2</button></li>
                    <li class="pagination_list__item"><button class="item__content">3</button></li>
                    <li class="pagination_list__item"><button class="item__content" aria-label="Next page in table">Next</button></li>
                </ul>
            </div>
        </section>
    </main>
    <div class="form__add_student modal_window_style">
        <div class="modal_window_container">
            <div class="modal_windows__control">
                <h2 class="modal_control__heading">Add Student</h2>
                <button onclick="CloseForm()" class="modal_control__close">
                    <img class="modal_control__close_icon" src="assets/img/modal-windows/close.svg" alt="Close">
                </button>
            </div>
            <form class="modal_window__form" action="index.php?action=create" method="post">
                <div class="form__student_group">
                    <label for="group" class="form__student_label">Group</label>
                    <select id="group" name="group" class="form__student_input">
                        <option value="" disabled hidden selected>Select group</option>
                        <option value="PZ-21">PZ-21</option>
                        <option value="PZ-22">PZ-22</option>
                        <option value="PZ-23">PZ-23</option>
                        <option value="PZ-24">PZ-24</option>
                    </select>
                    <div class="form__error_text"></div>
                </div>
                <div class="form__student_group">
                    <label for="first_name" class="form__student_label">First name</label>
                    <input type="text" name="first_name" id="first_name" class="form__student_input">
                    <div class="form__error_text"></div>
                </div>
                <div class="form__student_group">
                    <label for="last_name" class="form__student_label">Last Name</label>
                    <input type="text" name="last_name" id="last_name" class="form__student_input">
                    <div class="form__error_text"></div>
                </div>
                <div class="form__student_group">
                    <label for="gender" class="form__student_label">Gender</label>
                    <select id="gender" name="gender" class="form__student_input">
                        <option value="" disabled hidden selected>Select gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                    <div class="form__error_text"></div>
                </div>
                <div class="form__student_group">
                    <label for="birthday" class="form__student_label">Birthday</label>
                    <input type="date" name="birthday" id="birthday" class="form__student_input">
                    <div class="form__error_text"></div>
                </div>
                <div class="form__student_buttons">
                    <button onclick="CloseForm()" class="form__student_button">Cancel</button>
                    <button type="submit" class="form__student_button interact_student_button">Create</button>
                </div>
            </form>
        </div>
    </div>
    <div class="form__delete_student modal_window_style">
        <div class="modal_window_container">
            <div class="modal_windows__control">
                <h2 class="modal_control__heading">Warning</h2>
                <button onclick="CloseForm()" class="modal_control__close">
                    <img class="modal_control__close_icon" src="assets/img/modal-windows/close.svg" alt="Close">
                </button>
            </div>
            <div class="form__delete_student_text">
                <p class="form__delete_student_paragraph">Are you sure you want to delete user</p> <b><span id="delete_name"></span></b>
            </div>
            <div class="form__student_buttons">
                <button onclick="CloseForm()" class="form__student_button">Cancel</button>
                <button id="delete_student_btn" class="form__student_button">Delete</button>
            </div>
        </div>
    </div>
    <script src="./js/load_students.js"></script>
    <script src="./js/control_students.js"></script>
    <script src="./js/table_control.js"></script>
    <?php include './views/layouts/footer.php'; ?>
</body>
</html>