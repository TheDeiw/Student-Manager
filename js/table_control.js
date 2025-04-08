// Checkboxes Logic
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed"); // ← має з’явитись в консолі
    const birthdayInput = document.getElementById("birthday");
    const today = new Date().toISOString().split("T")[0];
    birthdayInput.setAttribute("max", today);

    const mainCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
    const tbody = document.querySelector(".main_table tbody");

    // Options in table
    tbody.addEventListener("change", function (event) {
        if (event.target.matches("input[type='checkbox']")) {
            const row = event.target.closest("tr");
            const icons = row.querySelectorAll(".table__icon");

            if (event.target.checked) {
                icons.forEach((icon) => icon.classList.add("active"));
            } else {
                icons.forEach((icon) => icon.classList.remove("active"));
            }
            updateSelectAllState();
        }
    });

    // Main checkbox
    mainCheckbox.addEventListener("change", function () {
        const targetState = mainCheckbox.checked;
        const allChildCheckboxes = document.querySelectorAll(".main_table tbody input[type='checkbox']");

        allChildCheckboxes.forEach((childCheckbox) => {
            if (childCheckbox.checked !== targetState) {
                childCheckbox.click();
            }
        });
        updateSelectAllState();
    });
});

function updateSelectAllState() {
    const mainCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
    const allChildCheckboxes = document.querySelectorAll(".main_table tbody input[type='checkbox']");

    const allChecked = [...allChildCheckboxes].every((cb) => cb.checked);
    mainCheckbox.checked = allChecked;

    const numberOfChecked = [...allChildCheckboxes].filter((cb) => cb.checked).length;
    console.log(numberOfChecked);
    const deleteButton = document.querySelector(".table__delete_student");

    if (numberOfChecked == 0) {
        deleteButton.classList.toggle("active", false);
        document.querySelector(".delete_student_describe").innerHTML = "Delete (0)";
    } else {
        deleteButton.classList.toggle("active", true);
        document.querySelector(".delete_student_describe").innerHTML = `Delete (${numberOfChecked})`;
    }
}

// Form Logic
function CloseForm() {
    let allForms = document.querySelectorAll(".modal_window_style");
    allForms.forEach((form) => form.classList.remove("active"));
    ClearInputForms();
}

function openDeleteStudentForm(studentId) {
    const deleteModal = document.querySelector(".form__delete_student");
    deleteModal.classList.add("active");

    let students = JSON.parse(localStorage.getItem("students")) || [];
    let student = students.find((s) => s.id === studentId);
    if (!student) return;

    document.querySelector(
        ".form__delete_student_paragraph"
    ).textContent = `Are you sure you want to delete user ${student.firstName} ${student.lastName}?`;

    const deleteButton = document.querySelector("#delete_student_btn");

    // // Щоб уникнути дублювання обробників, можна спочатку видалити попередній
    // deleteButton.replaceWith(deleteButton.cloneNode(true));
    // const newDeleteButton = document.querySelector("#delete_student_btn");

    deleteButton.addEventListener("click", function () {
        let updatedStudents = students.filter((s) => s.id !== studentId);
        localStorage.setItem("students", JSON.stringify(updatedStudents));

        const rows = document.querySelectorAll(".main_table tbody tr");
        rows.forEach((row) => {
            if (parseInt(row.firstChild.textContent) === studentId) {
                row.remove();
            }
        });
        CloseForm();
        updateSelectAllState();
    });
}

document.querySelector(".table__delete_student").addEventListener("click", function (event) {
    if (this.classList.contains("active")) {
        const checkedRows = [...document.querySelectorAll(".main_table tbody input[type='checkbox']")]
            .filter((cb) => cb.checked)
            .map((cb) => cb.closest("tr"));
        document.querySelector(".form__delete_student").classList.add("active");
        document.querySelector(".form__delete_student_paragraph").textContent =
            "Are you sure you want do delete all checked students: ";
        document.querySelector("#delete_name").textContent = `${
            [...document.querySelectorAll(".main_table tbody input[type='checkbox']")].filter((cb) => cb.checked).length
        }`;
        document.querySelector(".form__delete_student").classList.add("active");

        let deleteButton = document.querySelector("#delete_student_btn");
        deleteButton.addEventListener("click", function () {
            checkedRows.forEach((row) => row.remove());
            updateSelectAllState();
            CloseForm();
        });
    }
});

function ClearInputForms() {
    document.querySelectorAll("input, select").forEach((form) => {
        form.value = "";
        form.classList.toggle("error", false);
    });
    document.querySelectorAll(".form__error_text").forEach((text) => (text.textContent = ""));
}

function ShowErrorInput(element, message) {
    const inputControl = element.parentElement;
    const errorField = inputControl.querySelector(".form__error_text");

    errorField.textContent = message;
    element.classList.toggle("error", true);
}

function HideErrorInput(element) {
    const inputControl = element.parentElement;
    const errorField = inputControl.querySelector(".form__error_text");

    errorField.textContent = "";
    element.classList.toggle("error", false);
}
console.log("JS FILE LOADED");
document.querySelector(".table__add_student").addEventListener("click", function () {
    const form_addStudent = document.querySelector(".form__add_student");
    form_addStudent.querySelector(".modal_control__heading").textContent = "Add Student";
    form_addStudent.querySelector(".interact_student_button").textContent = "Create";
    form_addStudent.querySelector(".interact_student_button").id = "create_student_btn";
    form_addStudent.classList.toggle("active");
    console.log("Form submitted!1111");

    // Очищаємо попередні обробники, щоб уникнути дублювання
    const form = form_addStudent.querySelector(".modal_window__form");
    //form.removeEventListener("submit", handleFormSubmit); // Видаляємо старий обробник, якщо був
    form.addEventListener("submit", function (event) {
        event.preventDefault(); // Завжди зупиняємо стандартну відправку
        console.log("Form submitted!");

        // Перевіряємо валідність форми
        const isValid = CheckInputForms();
        console.log("Is form valid?", isValid);

        if (isValid) {
            console.log("Form is valid, sending data to server...");
            const formData = new FormData(this);

            fetch("process.php", {
                method: "POST",
                body: formData,
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.text();
                })
                .then((data) => {
                    console.log("Server response:", data);
                    CloseForm();
                    alert("Student added successfully!");
                })
                .catch((error) => {
                    console.error("Fetch error:", error);
                    alert("Failed to add student. Please try again.");
                });
        } else {
            console.log("Form is invalid, stopping submission.");
            // Додаткове повідомлення користувачу, якщо потрібно
            alert("Please fix the errors in the form.");
        }
    }); // Додаємо новий
});

// function handleFormSubmit(event) {}
// Creating student
// form_addStudent.querySelector(".interact_student_button").onclick = function () {
//     if (CheckInputForms()) {
//         CreateStudent();
//         CloseForm();
//         console.log("Student added successfully!");
//     }
// };

function openEditStudentForm(studentId) {
    let students = JSON.parse(localStorage.getItem("students")) || [];
    let student = students.find((s) => s.id === studentId);
    if (!student) return;

    const form = document.querySelector(".form__add_student");
    form.classList.add("active");
    form.querySelector(".modal_control__heading").textContent = "Edit Student";
    form.querySelector(".interact_student_button").textContent = "Save";
    form.querySelector(".interact_student_button").id = "edit_student_btn";

    document.getElementById("group").value = student.group;
    document.getElementById("first_name").value = student.firstName;
    document.getElementById("last_name").value = student.lastName;
    document.getElementById("gender").value = student.gender;
    document.getElementById("birthday").value = student.birthday;

    form.querySelector(".interact_student_button").onclick = function () {
        if (CheckInputForms()) {
            EditStudent(studentId);
            UpdateStudentTable();
            updateSelectAllState();
            CloseForm();
            console.log("Student edited successfully!");
        }
    };
}

function EditStudent(studentId) {
    let students = JSON.parse(localStorage.getItem("students")) || [];
    let studentIndex = students.findIndex((s) => s.id === studentId);

    const groupForm = document.getElementById("group");
    const firstNameForm = document.getElementById("first_name");
    const lastNameForm = document.getElementById("last_name");
    const genderForm = document.getElementById("gender");
    const birthdayForm = document.getElementById("birthday");

    const groupValue = groupForm.value;
    const firstNameValue = firstNameForm.value.trim();
    const lastNameValue = lastNameForm.value.trim();
    const genderValue = genderForm.value;
    const birthdayValue = birthdayForm.value;

    students[studentIndex].group = groupValue;
    students[studentIndex].firstName = firstNameValue;
    students[studentIndex].lastName = lastNameValue;
    students[studentIndex].gender = genderValue;
    students[studentIndex].birthday = birthdayValue;

    localStorage.setItem("students", JSON.stringify(students));
}

function UpdateStudentTable() {
    const students = JSON.parse(localStorage.getItem("students")) || [];
    const tableBody = document.querySelector(".main_table tbody");

    tableBody.innerHTML = ""; // Очищаємо таблицю перед оновленням

    students.forEach((student) => {
        let newRow = document.createElement("tr");

        // Функція для створення комірки
        function createCell(content) {
            let td = document.createElement("td");
            if (typeof content === "string" || typeof content === "number") {
                td.textContent = content;
            } else {
                td.appendChild(content);
            }
            return td;
        }

        // Checkbox + ID (прихований)
        let idCell = document.createElement("td");
        let hiddenText = document.createElement("span");
        hiddenText.textContent = student.id;
        hiddenText.style.display = "none";
        idCell.appendChild(hiddenText);

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        idCell.appendChild(checkbox);
        newRow.appendChild(idCell);

        // Group
        newRow.appendChild(createCell(student.group));

        // Name
        newRow.appendChild(createCell(student.firstName + " " + student.lastName));

        // Gender
        newRow.appendChild(createCell(student.gender));

        // Birthday
        newRow.appendChild(createCell(student.birthday));

        // Status
        let statusSpan = document.createElement("span");
        statusSpan.classList.add("table__active_cirtle");
        if (Math.random() < 0.5) {
            statusSpan.classList.add("active");
        }
        newRow.appendChild(createCell(statusSpan));

        // Option (Редагування + Видалення)
        let optionsDiv = document.createElement("div");
        optionsDiv.classList.add("table__cell_control");

        let editButton = document.createElement("button");
        editButton.classList.add("table__edit");
        let editButtonIcon = document.createElement("img");
        editButtonIcon.src = "assets/img/students-table/edit.svg";
        editButtonIcon.classList.add("table__icon");
        editButton.appendChild(editButtonIcon);
        editButton.addEventListener("click", function () {
            openEditStudentForm(student.id);
        });

        let deleteButton = document.createElement("button");
        deleteButton.classList.add("table__delete");
        let deleteButtonIcon = document.createElement("img");
        deleteButtonIcon.src = "assets/img/students-table/delete.svg";
        deleteButtonIcon.classList.add("table__icon");
        deleteButton.appendChild(deleteButtonIcon);
        deleteButton.addEventListener("click", function () {
            openDeleteStudentForm(student.id);
        });

        optionsDiv.appendChild(editButton);
        optionsDiv.appendChild(deleteButton);
        newRow.appendChild(createCell(optionsDiv));

        // Додаємо рядок до таблиці
        tableBody.appendChild(newRow);
    });
}

function CheckInputForms() {
    const groupForm = document.getElementById("group");
    const firstNameForm = document.getElementById("first_name");
    const lastNameForm = document.getElementById("last_name");
    const genderForm = document.getElementById("gender");
    const birthdayForm = document.getElementById("birthday");

    const groupValue = groupForm.value;
    const firstNameValue = firstNameForm.value.trim();
    const lastNameValue = lastNameForm.value.trim();
    const genderValue = genderForm.value;
    const birthdayValue = birthdayForm.value;

    let allowCreating = true;

    // Check Group Selector
    if (groupValue === "") {
        ShowErrorInput(groupForm, "Group is required");
        allowCreating = false;
    } else {
        HideErrorInput(groupForm);
    }

    // Check First Name
    if (firstNameValue === "") {
        ShowErrorInput(firstNameForm, "First name is required");
        allowCreating = false;
    } else if (firstNameValue.length < 2 || firstNameValue.length > 50) {
        ShowErrorInput(firstNameForm, "First name must be between 2 and 50 characters");
        allowCreating = false;
    } else if (!/^[A-ZА-ЯЁІЇЄ]/.test(firstNameValue)) {
        ShowErrorInput(firstNameForm, "First name must start with an uppercase letter");
        allowCreating = false;
    } else if (!/^[A-Za-zА-Яа-яЁёІіЇїЄє-]+$/.test(firstNameValue)) {
        ShowErrorInput(firstNameForm, "First name can only contain letters");
        allowCreating = false;
    } else {
        HideErrorInput(firstNameForm);
    }

    // Check Last Name
    if (lastNameValue === "") {
        ShowErrorInput(lastNameForm, "Last name is required");
        allowCreating = false;
    } else if (lastNameValue.length < 2 || lastNameValue.length > 50) {
        ShowErrorInput(lastNameForm, "Last name must be between 2 and 50 characters");
        allowCreating = false;
    } else if (!/^[A-ZА-ЯЁІЇЄ]/.test(lastNameValue)) {
        ShowErrorInput(lastNameForm, "Last name must start with an uppercase letter");
        allowCreating = false;
    } else if (!/^[A-Za-zА-Яа-яЁёІіЇїЄє-]+$/.test(lastNameValue)) {
        ShowErrorInput(lastNameForm, "Last name can only contain letters");
        allowCreating = false;
    } else {
        HideErrorInput(lastNameForm);
    }

    // Check Gender Selector
    if (genderValue === "") {
        ShowErrorInput(genderForm, "Gender is required");
        allowCreating = false;
    } else {
        HideErrorInput(genderForm);
    }

    // Check Birthday
    const birthdayDate = new Date(birthdayValue);
    const today = new Date();
    const age = today.getFullYear() - birthdayDate.getFullYear();
    const monthDiff = today.getMonth() - birthdayDate.getMonth();
    const dayDiff = today.getDate() - birthdayDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        //age--;
    }

    if (birthdayValue === "") {
        ShowErrorInput(birthdayForm, "Birthday is required");
        allowCreating = false;
    } else if (isNaN(birthdayDate.getTime())) {
        ShowErrorInput(birthdayForm, "Invalid date format");
        allowCreating = false;
    } else if (age < 18 || age > 100) {
        ShowErrorInput(birthdayForm, "Age must be 18+");
        allowCreating = false;
    } else {
        HideErrorInput(birthdayForm);
    }

    return allowCreating;
}

function CreateStudent() {
    // Find main elements in table
    let tableBody = document.querySelector(".main_table tbody");
    let newRow = document.createElement("tr");

    let studentIdCounter = parseInt(localStorage.getItem("studentIdCounter") || "0", 10) + 1;
    localStorage.setItem("studentIdCounter", studentIdCounter);

    // Cool funtcion to create cell
    function createCell(content) {
        let td = document.createElement("td");
        if (typeof content === "string") {
            td.textContent = content;
        } else {
            td.appendChild(content);
        }
        return td;
    }

    // Checkbox
    let idCell = document.createElement("td");

    let hiddenText = document.createElement("span");
    hiddenText.textContent = studentIdCounter;
    hiddenText.style.display = "none";
    idCell.appendChild(hiddenText);
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    idCell.appendChild(checkbox);
    newRow.appendChild(idCell);

    // Group
    let groupSelect = document.getElementById("group").value;
    newRow.appendChild(createCell(groupSelect));

    // Name
    let firstNameInput = document.getElementById("first_name").value;
    let lastNameInput = document.getElementById("last_name").value;
    let nameInput = firstNameInput + " " + lastNameInput;
    newRow.appendChild(createCell(nameInput));

    // Gender
    let genderSelect = document.getElementById("gender").value;
    newRow.appendChild(createCell(genderSelect));

    // Birthday
    let birthdayInput = document.getElementById("birthday").value;
    newRow.appendChild(createCell(birthdayInput));

    // Status
    let statusSpan = document.createElement("span");
    statusSpan.classList.add("table__active_cirtle");
    const randomBoolean = Math.random() < 0.5;
    if (randomBoolean) {
        statusSpan.classList.add("active");
    }
    newRow.appendChild(createCell(statusSpan));

    // Option
    let optionsDiv = document.createElement("div");
    optionsDiv.classList.add("table__cell_control");

    let editButton = document.createElement("button");
    editButton.classList.add("table__edit");
    let editButtonIcon = document.createElement("img");
    editButtonIcon.src = "assets/img/students-table/edit.svg";
    editButtonIcon.classList.add("table__icon");
    editButton.appendChild(editButtonIcon);
    editButton.addEventListener("click", function (event) {
        let icon = event.target.closest(".table__icon");
        if (icon && icon.classList.contains("active")) {
            openEditStudentForm(studentIdCounter);
        }
    });

    let deleteButton = document.createElement("button");
    deleteButton.classList.add("table__delete");
    let deleteButtonIcon = document.createElement("img");
    deleteButtonIcon.src = "assets/img/students-table/delete.svg";
    deleteButtonIcon.classList.add("table__icon");
    deleteButton.appendChild(deleteButtonIcon);
    deleteButton.addEventListener("click", function (event) {
        let icon = event.target.closest(".table__icon");
        if (icon && icon.classList.contains("active")) {
            openDeleteStudentForm(studentIdCounter);
        }
    });

    optionsDiv.appendChild(editButton);
    optionsDiv.appendChild(deleteButton);
    newRow.appendChild(createCell(optionsDiv));

    //Local starage
    const studentData = {
        id: studentIdCounter,
        group: groupSelect,
        firstName: firstNameInput.trim(),
        lastName: lastNameInput.trim(),
        gender: genderSelect, // Залежно від формату (M/F)
        birthday: birthdayInput,
    };
    let students = JSON.parse(localStorage.getItem("students")) || [];
    students.push(studentData);
    localStorage.setItem("students", JSON.stringify(students));

    // Create row
    tableBody.appendChild(newRow);
    //CloseForm();
    ClearInputForms();
}
