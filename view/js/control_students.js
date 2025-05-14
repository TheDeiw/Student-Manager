function openAddForm() {
    console.log("openAddForm");
    const form = document.querySelector(".form__add_student");
    form.classList.add("active");
    form.querySelector(".modal_control__heading").textContent = "Add Student";
    form.querySelector(".interact_student_button").textContent = "Create";

    // Clone and replace the form to remove any existing event listeners
    const formElement = form.querySelector(".modal_window__form");
    const newFormElement = formElement.cloneNode(true);
    formElement.parentNode.replaceChild(newFormElement, formElement);

    newFormElement.addEventListener("submit", async (event) => {
        event.preventDefault();

        const groupSelect = document.getElementById("group");
        const firstNameInput = document.getElementById("first_name");
        const lastNameInput = document.getElementById("last_name");
        const genderSelect = document.getElementById("gender");
        const birthdayInput = document.getElementById("birthday");

        const studentData = JSON.stringify({
            group: groupSelect.value,
            first_name: firstNameInput.value,
            last_name: lastNameInput.value,
            gender: genderSelect.value,
            birthday: birthdayInput.value,
        });

        try {
            const response = await fetch("http://localhost/Student-Manager/api/students", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: studentData,
            });

            const result = await response.json();

            if (!response.ok) {
                console.log("Error response:", result);
                // Handle the errors from the server
                if (result.errors) {
                    displayErrors(result.errors);
                } else if (result.error) {
                    displayErrors([result.error]);
                } else {
                    displayErrors(["Помилка на сервері"]);
                }
                return;
            }

            if (result.success) {
                await loadStudents();
                CloseForm();
            } else {
                displayErrors([result.error || "Не вдалося додати студента"]);
            }
        } catch (error) {
            console.error("Error:", error);
            displayErrors(["Сталася помилка при спробі зв'язатися з сервером"]);
        }
    });
}

function openEditForm(studentId) {
    const form = document.querySelector(".form__add_student");
    form.classList.add("active");
    form.querySelector(".modal_control__heading").textContent = "Edit Student";
    form.querySelector(".interact_student_button").textContent = "Save";

    fetch(`http://localhost/Student-Manager/api/students/${studentId}`)
        .then((response) => response.json())
        .then((student) => {
            document.getElementById("group").value = student.group;
            document.getElementById("first_name").value = student.first_name;
            document.getElementById("last_name").value = student.last_name;
            document.getElementById("gender").value = student.gender;
            document.getElementById("birthday").value = student.birthday;

            const formElement = form.querySelector(".modal_window__form");
            const newFormElement = formElement.cloneNode(true);
            formElement.parentNode.replaceChild(newFormElement, formElement);

            const groupSelect = newFormElement.querySelector("#group");
            const genderSelect = newFormElement.querySelector("#gender");

            groupSelect.value = student.group_name;
            genderSelect.value = student.gender;
            newFormElement.addEventListener("submit", async (event) => {
                event.preventDefault();

                const studentData = JSON.stringify({
                    id: studentId,
                    group: document.getElementById("group").value,
                    first_name: document.getElementById("first_name").value,
                    last_name: document.getElementById("last_name").value,
                    gender: document.getElementById("gender").value,
                    birthday: document.getElementById("birthday").value,
                });

                try {
                    const response = await fetch(`http://localhost/Student-Manager/api/students/${studentId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: studentData,
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        console.log("Error response:", result);
                        if (result.errors) {
                            displayErrors(result.errors);
                        } else if (result.error) {
                            displayErrors([result.error]);
                        } else {
                            displayErrors(["Помилка на сервері"]);
                        }
                        return;
                    }

                    if (result.success) {
                        await loadStudents();
                        CloseForm();
                    } else {
                        displayErrors([result.error || "Не вдалося оновити студента"]);
                    }
                } catch (error) {
                    console.error("Error:", error);
                    displayErrors(["Сталася помилка при спробі зв'язатися з сервером"]);
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
        // Single student deletion
        const row = document.querySelector(`.main_table tbody tr[data-id="${studentId}"]`);
        const name = row.querySelector("td:nth-child(3)").textContent;
        document.querySelector("#delete_name").textContent = name;

        const deleteButton = document.querySelector("#delete_student_btn");
        const newDeleteButton = deleteButton.cloneNode(true);
        deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

        newDeleteButton.onclick = async () => {
            const deleteData = JSON.stringify({ id: studentId });

            try {
                const response = await fetch(`http://localhost/Student-Manager/api/students/${studentId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: deleteData,
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
        // Multiple students deletion
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
            const deleteData = JSON.stringify({ ids: ids });

            try {
                const response = await fetch("http://localhost/Student-Manager/api/students", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: deleteData,
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
    // Reset all error states
    document.querySelectorAll(".form__error_text").forEach((text) => (text.textContent = ""));
    document.querySelectorAll("input, select").forEach((input) => input.classList.remove("error"));

    // Return early if there are no errors
    if (!errors || errors.length === 0) return;

    // Check if errors is an array (from your PHP backend)
    if (Array.isArray(errors)) {
        errors.forEach((error) => {
            // Map error messages to their corresponding form fields
            if (error.includes("Group")) {
                ShowErrorInput(document.getElementById("group"), error);
            } else if (error.includes("First name")) {
                ShowErrorInput(document.getElementById("first_name"), error);
            } else if (error.includes("Last name")) {
                ShowErrorInput(document.getElementById("last_name"), error);
            } else if (error.includes("Gender")) {
                ShowErrorInput(document.getElementById("gender"), error);
            } else if (error.includes("Birthday") || error.includes("Age")) {
                ShowErrorInput(document.getElementById("birthday"), error);
            } else if (error.includes("Student already exists")) {
                // Show duplicate student error on both first and last name fields
                ShowErrorInput(document.getElementById("first_name"), error);
                ShowErrorInput(document.getElementById("last_name"), error);
            } else {
                // For any other errors, display on a general error element if available,
                // or default to first name field
                const generalError = document.querySelector(".general-error");
                if (generalError) {
                    generalError.textContent = error;
                } else {
                    ShowErrorInput(document.getElementById("first_name"), error);
                }
            }
        });
    } else if (typeof errors === "object") {
        // For object-based errors (field: message format)
        for (let field in errors) {
            const errorMessage = errors[field];
            const inputElement = document.getElementById(field);
            if (inputElement) {
                ShowErrorInput(inputElement, errorMessage);
            }
        }
    } else if (typeof errors === "string") {
        // If it's just a single error string
        ShowErrorInput(document.getElementById("first_name"), errors);
    }
}

function ShowErrorInput(element, message) {
    if (!element) return; // Skip if element doesn't exist

    const inputControl = element.parentElement;
    const errorField = inputControl.querySelector(".form__error_text");
    if (errorField) {
        // If there's already content, add a line break
        if (errorField.textContent) {
            errorField.textContent += "\n" + message;
        } else {
            errorField.textContent = message;
        }
        element.classList.add("error");
    }
}
