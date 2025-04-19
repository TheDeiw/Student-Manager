// async function loadStudents() {
//     try {
//         const response = await fetch("api/get_students.php");
//         if (!response.ok) {
//             throw new Error("Помилка при отриманні даних");
//         }
//         const students = await response.json();

//         // Проходимо по кожному студентові
//         students.forEach((student) => {
//             // Конвертуємо об'єкт студента у FormData
//             const formData = new FormData();
//             formData.append("id", student.id);
//             formData.append("first_name", student.first_name);
//             formData.append("last_name", student.last_name);
//             formData.append("group", student.group_name);
//             formData.append("gender", student.gender);
//             formData.append("birthday", student.birthday);

//             // Викликаємо функцію для додавання студента до таблиці
//             addStudentToTable(formData);
//         });
//     } catch (error) {
//         console.error("Помилка:", error);
//     }
// }
async function loadStudents() {
    try {
        const response = await fetch("api/get_students.php");
        if (!response.ok) {
            throw new Error("Помилка при отриманні даних");
        }
        const students = await response.json();
        const tableBody = document.querySelector(".main_table tbody");
        tableBody.innerHTML = ""; // Очищаємо таблицю перед завантаженням

        students.forEach((student) => {
            const row = document.createElement("tr");
            row.setAttribute("data-id", student.id); // Додаємо атрибут data-id для легшого доступу

            // Checkbox
            const idCell = document.createElement("td");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            idCell.appendChild(checkbox);
            row.appendChild(idCell);

            // Group
            row.appendChild(createCell(student.group_name));

            // Name
            row.appendChild(createCell(`${student.first_name} ${student.last_name}`));

            // Gender
            row.appendChild(createCell(student.gender));

            // Birthday
            row.appendChild(createCell(student.birthday));

            // Status
            const statusSpan = document.createElement("span");
            statusSpan.classList.add("table__active_cirtle");
            if (Math.random() < 0.5) {
                statusSpan.classList.add("active");
            }
            row.appendChild(createCell(statusSpan));

            // Option
            const optionsDiv = document.createElement("div");
            optionsDiv.classList.add("table__cell_control");

            const editButton = document.createElement("button");
            editButton.classList.add("table__edit");
            const editButtonIcon = document.createElement("img");
            editButtonIcon.src = "assets/img/students-table/edit.svg";
            editButtonIcon.classList.add("table__icon");
            editButton.appendChild(editButtonIcon);
            editButton.addEventListener("click", () => openEditStudentForm(student.id));

            const deleteButton = document.createElement("button");
            deleteButton.classList.add("table__delete");
            const deleteButtonIcon = document.createElement("img");
            deleteButtonIcon.src = "assets/img/students-table/delete.svg";
            deleteButtonIcon.classList.add("table__icon");
            deleteButton.appendChild(deleteButtonIcon);
            deleteButton.addEventListener("click", () => openDeleteStudentForm(student.id));

            optionsDiv.appendChild(editButton);
            optionsDiv.appendChild(deleteButton);
            row.appendChild(createCell(optionsDiv));

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Помилка:", error);
    }
}

// Допоміжна функція для створення комірок
function createCell(content) {
    const td = document.createElement("td");
    if (typeof content === "string") {
        td.textContent = content;
    } else {
        td.appendChild(content);
    }
    return td;
}
