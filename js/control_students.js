function openAddForm() {
    const form = document.querySelector(".form__add_student");
    form.classList.add("active");
    form.querySelector(".modal_control__heading").textContent = "Add Student";
    form.querySelector(".interact_student_button").textContent = "Create";

    const formElement = form.querySelector(".modal_window__form");
    // Видаляємо попередні обробники, щоб уникнути дублювання
    const newFormElement = formElement.cloneNode(true);
    formElement.parentNode.replaceChild(newFormElement, formElement);

    newFormElement.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(newFormElement);

        try {
            const response = await fetch("index.php?action=create", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                const data = await response.json();
                displayErrors(data.errors || ["Помилка на сервері"]);
                throw new Error("Validation errors");
            }
            const result = await response.json();
            if (result.success) {
                await loadStudents(); // Оновлюємо таблицю
                CloseForm();
            } else {
                displayErrors([result.error || "Не вдалося додати студента"]);
            }
        } catch (error) {
            console.error("Error:", error);
            displayErrors(["Помилка при додаванні студента"]);
        }
    });
}

function openEditForm(studentId) {
    const form = document.querySelector(".form__add_student");
    form.classList.add("active");
    form.querySelector(".modal_control__heading").textContent = "Edit Student";
    form.querySelector(".interact_student_button").textContent = "Save";

    // Завантажуємо дані студента
    fetch(`index.php?action=edit&id=${studentId}`)
        .then((response) => response.json())
        .then((student) => {
            document.getElementById("group").value = student.group_name;
            document.getElementById("first_name").value = student.first_name;
            document.getElementById("last_name").value = student.last_name;
            document.getElementById("gender").value = student.gender;
            document.getElementById("birthday").value = student.birthday;

            const formElement = form.querySelector(".modal_window__form");
            const newFormElement = formElement.cloneNode(true);
            formElement.parentNode.replaceChild(newFormElement, formElement);

            newFormElement.addEventListener("submit", async (event) => {
                event.preventDefault();
                const formData = new FormData(newFormElement);
                formData.append("id", studentId);

                try {
                    const response = await fetch("index.php?action=update", {
                        method: "POST",
                        body: formData,
                    });
                    if (!response.ok) {
                        const data = await response.json();
                        displayErrors(data.errors || ["Помилка на сервері"]);
                        throw new Error("Validation errors");
                    }
                    await loadStudents();
                    CloseForm();
                } catch (error) {
                    console.error("Error:", error);
                    displayErrors(["Помилка при редагуванні студента"]);
                }
            });
        })
        .catch((error) => {
            console.error("Error:", error);
            displayErrors(["Помилка при завантаженні даних студента"]);
        });
}

function openDeleteForm(studentId) {
    const form = document.querySelector(".form__delete_student");
    form.classList.add("active");

    if (studentId) {
        // Видалення одного студента
        const row = document.querySelector(`.main_table tbody tr[data-id="${studentId}"]`);
        const name = row.querySelector("td:nth-child(3)").textContent;
        document.querySelector("#delete_name").textContent = name;

        const deleteButton = document.querySelector("#delete_student_btn");
        const newDeleteButton = deleteButton.cloneNode(true);
        deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

        newDeleteButton.onclick = async () => {
            try {
                const response = await fetch("index.php?action=delete", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: `id=${studentId}`,
                });
                if (!response.ok) throw new Error("Failed to delete student");
                await loadStudents();
                CloseForm();
            } catch (error) {
                console.error("Error:", error);
                displayErrors(["Помилка при видаленні студента"]);
            }
        };
    } else {
        // Множинне видалення (обрані чекбокси)
        const checkboxes = document.querySelectorAll('.main_table tbody input[type="checkbox"]:checked');
        const ids = Array.from(checkboxes).map((cb) => cb.closest("tr").dataset.id);

        if (ids.length === 0) {
            alert("Виберіть хоча б одного студента для видалення");
            form.classList.remove("active");
            return;
        }

        document.querySelector("#delete_name").textContent = `${ids.length} вибраних студентів`;

        const deleteButton = document.querySelector("#delete_student_btn");
        const newDeleteButton = deleteButton.cloneNode(true);
        deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

        newDeleteButton.onclick = async () => {
            try {
                const response = await fetch("index.php?action=deleteMultiple", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: `ids=${JSON.stringify(ids)}`,
                });
                if (!response.ok) throw new Error("Failed to delete students");
                await loadStudents();
                CloseForm();
            } catch (error) {
                console.error("Error:", error);
                displayErrors(["Помилка при видаленні студентів"]);
            }
        };
    }
}

function CloseForm() {
    document.querySelectorAll(".modal_window_style").forEach((form) => form.classList.remove("active"));
    ClearInputForms();
}

function ClearInputForms() {
    document.querySelectorAll("input, select").forEach((input) => {
        if (input.type !== "checkbox") {
            input.value = "";
        }
        input.classList.remove("error");
    });
    document.querySelectorAll(".form__error_text").forEach((text) => (text.textContent = ""));
}

function displayErrors(errors) {
    document.querySelectorAll(".form__error_text").forEach((text) => (text.textContent = ""));
    document.querySelectorAll("input, select").forEach((input) => input.classList.remove("error"));

    errors.forEach((error) => {
        if (error.includes("Group")) ShowErrorInput(document.getElementById("group"), error);
        else if (error.includes("First name")) ShowErrorInput(document.getElementById("first_name"), error);
        else if (error.includes("Last name")) ShowErrorInput(document.getElementById("last_name"), error);
        else if (error.includes("Gender")) ShowErrorInput(document.getElementById("gender"), error);
        else if (error.includes("Birthday") || error.includes("Age"))
            ShowErrorInput(document.getElementById("birthday"), error);
        else if (error.includes("Student already exists")) ShowErrorInput(document.getElementById("first_name"), error);
        else ShowErrorInput(document.getElementById("first_name"), error);
    });
}

function ShowErrorInput(element, message) {
    const inputControl = element.parentElement;
    const errorField = inputControl.querySelector(".form__error_text");
    errorField.textContent = message;
    element.classList.add("error");
}
