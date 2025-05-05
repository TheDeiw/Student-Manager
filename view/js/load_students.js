async function loadStudents() {
    try {
        const response = await fetch("http://localhost/Student-Manager/api/students");
        if (!response.ok) {
            throw new Error("Помилка при отриманні даних");
        }
        const data = await response.json();
        const students = data.students || [];
        const isLoggedIn = data.isLoggedIn || false;

        const tableBody = document.querySelector(".main_table tbody");
        let rows = "";

        students.forEach((student) => {
            const statusClass = Math.random() < 0.5 ? "active" : "";
            rows += `
                <tr data-id="${student.id}">
                    <td>
                        <input type="checkbox" name="student_ids[]" value="${student.id}">
                    </td>
                    <td>${student.group_name}</td>
                    <td>${student.first_name} ${student.last_name}</td>
                    <td>${student.gender}</td>
                    <td>${student.birthday}</td>
                    <td><span class="table__active_circle ${statusClass}"></span></td>
                    <td>
                                <div class="table__cell_control">
                                <button class="table__edit" onclick="openEditForm(${student.id})">
                                    <img class="table__icon" src="./assets/img/students-table/edit.svg" alt="Edit">
                                </button>
                                <button class="table__delete" onclick="openDeleteForm(${student.id})">
                                    <img class="table__icon" src="./assets/img/students-table/delete.svg" alt="Delete">
                                </button>
                            </div>
                        
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = rows;

        // Оновлюємо стан кнопок відповідно до аутентифікації
        // updateButtonStates(isLoggedIn);
    } catch (error) {
        console.error("Помилка:", error);
    }
}

// Функція для оновлення стану кнопок відповідно до аутентифікації
// function updateButtonStates(isLoggedIn) {
//     const addButton = document.querySelector(".table__add_student");
//     const deleteButton = document.querySelector(".table__delete_student");

//     if (addButton) {
//         if (isLoggedIn) {
//             addButton.classList.remove("disabled");
//             addButton.disabled = false;
//         } else {
//             addButton.classList.add("disabled");
//             addButton.disabled = true;
//         }
//     }

//     if (deleteButton) {
//         if (isLoggedIn) {
//             deleteButton.classList.remove("disabled");
//             deleteButton.disabled = false;
//         } else {
//             deleteButton.classList.add("disabled");
//             deleteButton.disabled = true;
//         }
//     }
// }

// Завантажуємо студентів при завантаженні сторінки
document.addEventListener("DOMContentLoaded", loadStudents);
