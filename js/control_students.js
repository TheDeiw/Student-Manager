// function addStudentToTable(formData) {
//     const tableBody = document.querySelector(".main_table tbody");
//     const newRow = document.createElement("tr");

//     const studentId = formData.get("id");

//     // Checkbox + ID (прихований)
//     const idCell = document.createElement("td");
//     const hiddenText = document.createElement("span");
//     hiddenText.textContent = studentId;
//     hiddenText.style.display = "none";
//     idCell.appendChild(hiddenText);
//     const checkbox = document.createElement("input");
//     checkbox.type = "checkbox";
//     idCell.appendChild(checkbox);
//     newRow.appendChild(idCell);

//     // Group
//     const group = formData.get("group");
//     newRow.appendChild(createCell(group));

//     // Name
//     const firstName = formData.get("first_name");
//     const lastName = formData.get("last_name");
//     const name = firstName + " " + lastName;
//     newRow.appendChild(createCell(name));

//     // Gender
//     const gender = formData.get("gender");
//     newRow.appendChild(createCell(gender));

//     // Birthday
//     const birthday = formData.get("birthday");
//     newRow.appendChild(createCell(birthday));

//     // Status
//     const statusSpan = document.createElement("span");
//     statusSpan.classList.add("table__active_cirtle");
//     if (Math.random() < 0.5) {
//         statusSpan.classList.add("active");
//     }
//     newRow.appendChild(createCell(statusSpan));

//     // Option
//     const optionsDiv = document.createElement("div");
//     optionsDiv.classList.add("table__cell_control");

//     const editButton = document.createElement("button");
//     editButton.classList.add("table__edit");
//     const editButtonIcon = document.createElement("img");
//     editButtonIcon.src = "assets/img/students-table/edit.svg";
//     editButtonIcon.classList.add("table__icon");
//     editButton.appendChild(editButtonIcon);
//     editButton.addEventListener("click", function () {
//         openEditStudentForm(studentId);
//     });

//     const deleteButton = document.createElement("button");
//     deleteButton.classList.add("table__delete");
//     const deleteButtonIcon = document.createElement("img");
//     deleteButtonIcon.src = "assets/img/students-table/delete.svg";
//     deleteButtonIcon.classList.add("table__icon");
//     deleteButton.appendChild(deleteButtonIcon);
//     deleteButton.addEventListener("click", function () {
//         openDeleteStudentForm(studentId);
//     });

//     optionsDiv.appendChild(editButton);
//     optionsDiv.appendChild(deleteButton);
//     newRow.appendChild(createCell(optionsDiv));

//     tableBody.appendChild(newRow);
// }

// // Функція для створення комірки
// function createCell(content) {
//     const td = document.createElement("td");
//     if (typeof content === "string" || typeof content === "number") {
//         td.textContent = content;
//     } else {
//         td.appendChild(content);
//     }
//     return td;
// }

async function deleteStudent(studentId) {
    try {
        const response = await fetch("api/delete_student.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `id=${studentId}`,
        });

        if (!response.ok) {
            throw new Error("Failed to delete student");
        }

        const data = await response.json();
        if (data.success) {
            await loadStudents(); // Оновлюємо таблицю після видалення
        } else {
            console.error("Failed to delete student:", data.error);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function openDeleteStudentForm(studentId) {
    const deleteModal = document.querySelector(".form__delete_student");
    deleteModal.classList.add("active");

    const row = document.querySelector(`.main_table tbody tr[data-id="${studentId}"]`);
    const name = row.querySelector("td:nth-child(3)").textContent;
    document.querySelector("#delete_name").textContent = name;

    const deleteButton = document.querySelector("#delete_student_btn");
    deleteButton.onclick = async function () {
        await deleteStudent(studentId);
        CloseForm();
    };
}

// Видалення кількох студентів
document.querySelector(".table__delete_student").addEventListener("click", async function (event) {
    if (this.classList.contains("active")) {
        const checkedRows = [...document.querySelectorAll(".main_table tbody input[type='checkbox']:checked")].map(
            (cb) => cb.closest("tr")
        );

        if (checkedRows.length === 0) return;

        const confirmation = confirm(`Are you sure you want to delete ${checkedRows.length} student(s)?`);
        if (!confirmation) return;

        for (const row of checkedRows) {
            const studentId = row.getAttribute("data-id");
            await deleteStudent(studentId);
        }

        updateSelectAllState();
    }
});

async function openEditStudentForm(studentId) {
    try {
        const response = await fetch(`api/get_students.php`); // Потрібен окремий ендпоінт для одного студента
        if (!response.ok) throw new Error("Failed to fetch student");
        const students = await response.json();
        const student = students.find((s) => s.id == studentId);

        const form = document.querySelector(".form__add_student");
        form.classList.add("active");
        form.querySelector(".modal_control__heading").textContent = "Edit Student";
        form.querySelector(".interact_student_button").textContent = "Save";
        form.querySelector(".interact_student_button").id = "edit_student_btn";

        document.getElementById("group").value = student.group_name;
        document.getElementById("first_name").value = student.first_name;
        document.getElementById("last_name").value = student.last_name;
        document.getElementById("gender").value = student.gender;
        document.getElementById("birthday").value = student.birthday;

        const submitButton = form.querySelector(".interact_student_button");
        submitButton.onclick = async function (event) {
            event.preventDefault();
            const formData = new FormData(form.querySelector(".modal_window__form"));
            formData.append("id", studentId);

            try {
                const response = await fetch("api/update_student.php", {
                    // Потрібен новий PHP-скрипт
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json();
                    displayErrors(data.errors);
                    throw new Error("Validation errors");
                }

                await loadStudents(); // Оновлюємо таблицю після редагування
                CloseForm();
                updateSelectAllState();
            } catch (error) {
                console.error("Error:", error);
            }
        };
    } catch (error) {
        console.error("Error:", error);
    }
}
