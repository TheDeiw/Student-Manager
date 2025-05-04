
document.addEventListener("DOMContentLoaded", function () {
    const mainCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
    const tbody = document.querySelector(".main_table tbody");

    // Логіка для чекбоксів у рядках
    tbody.addEventListener("change", function (event) {
        if (event.target.matches("input[type='checkbox']")) {
            updateSelectAllState();
        }
    });

    // Логіка для головного чекбокса у заголовку
    mainCheckbox.addEventListener("change", function () {
        const targetState = mainCheckbox.checked;
        const allChildCheckboxes = document.querySelectorAll(".main_table tbody input[type='checkbox']");
        allChildCheckboxes.forEach((checkbox) => {
            checkbox.checked = targetState;
        });
        updateSelectAllState();
    });

    // Оновлення стану головного чекбокса та кнопки видалення
    function updateSelectAllState() {
        const allChildCheckboxes = document.querySelectorAll(".main_table tbody input[type='checkbox']");
        const numberOfChecked = [...allChildCheckboxes].filter((cb) => cb.checked).length;
        const deleteButton = document.querySelector(".table__delete_student");

        // Оновлюємо головний чекбокс: вибраний, якщо всі рядки вибрані
        mainCheckbox.checked = numberOfChecked === allChildCheckboxes.length && numberOfChecked > 0;

        // Оновлюємо кнопку видалення
        deleteButton.classList.toggle("active", numberOfChecked > 0);
        document.querySelector(".delete_student_describe").textContent = `Delete (${numberOfChecked})`;
    }
});

// // Form Logic
// function CloseForm() {
//     let allForms = document.querySelectorAll(".modal_window_style");
//     allForms.forEach((form) => form.classList.remove("active"));
//     ClearInputForms();
// }

// function ClearInputForms() {
//     document.querySelectorAll("input, select").forEach((form) => {
//         form.value = "";
//         form.classList.toggle("error", false);
//     });
//     document.querySelectorAll(".form__error_text").forEach((text) => (text.textContent = ""));
// }

// function ShowErrorInput(element, message) {
//     const inputControl = element.parentElement;
//     const errorField = inputControl.querySelector(".form__error_text");
//     errorField.textContent = message;
//     element.classList.add("error");
// }

// function HideErrorInput(element) {
//     const inputControl = element.parentElement;
//     const errorField = inputControl.querySelector(".form__error_text");
//     errorField.textContent = "";
//     element.classList.remove("error");
// }

// document.querySelector(".table__add_student").addEventListener("click", function () {
//     const form_addStudent = document.querySelector(".form__add_student");
//     form_addStudent.querySelector(".modal_control__heading").textContent = "Add Student";
//     form_addStudent.querySelector(".interact_student_button").textContent = "Create";
//     form_addStudent.querySelector(".interact_student_button").id = "create_student_btn";
//     form_addStudent.classList.toggle("active");

//     const form = form_addStudent.querySelector(".modal_window__form");
//     form.addEventListener("submit", async function (event) {
//         event.preventDefault();
//         const formData = new FormData(this);

//         try {
//             const response = await fetch("api/students.php", {
//                 method: "POST",
//                 body: formData,
//             });

//             if (!response.ok) {
//                 const data = await response.json();
//                 displayErrors(data.errors);
//                 throw new Error("Validation errors");
//             }

//             await loadStudents();
//             CloseForm();
//         } catch (error) {
//             console.error("Error:", error);
//         }
//     });
// });

// function displayErrors(errors) {
//     // Скидаємо всі помилки
//     document.querySelectorAll(".form__error_text").forEach((text) => (text.textContent = ""));
//     document.querySelectorAll("input, select").forEach((input) => input.classList.remove("error"));

//     // Відображаємо помилки під відповідними полями
//     errors.forEach((error) => {
//         if (error.includes("Group")) {
//             ShowErrorInput(document.getElementById("group"), error);
//         } else if (error.includes("First name")) {
//             ShowErrorInput(document.getElementById("first_name"), error);
//         } else if (error.includes("Last name")) {
//             ShowErrorInput(document.getElementById("last_name"), error);
//         } else if (error.includes("Gender")) {
//             ShowErrorInput(document.getElementById("gender"), error);
//         } else if (error.includes("Birthday") || error.includes("Age")) {
//             ShowErrorInput(document.getElementById("birthday"), error);
//         } else if (error.includes("Student already exists")) {
//             ShowErrorInput(document.getElementById("first_name"), error); // Помилка дублювання відображається під ім'ям
//         }
//     });
// }
