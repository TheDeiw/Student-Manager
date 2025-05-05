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
            const checkboxDisabled = isLoggedIn ? "" : "disabled";
            rows += `
                <tr data-id="${student.id}">
                    <td>
                        <input type="checkbox" name="student_ids[]" value="${student.id}" ${checkboxDisabled}>
                    </td>
                    <td>${student.group_name}</td>
                    <td>${student.first_name} ${student.last_name}</td>
                    <td>${student.gender}</td>
                    <td>${student.birthday}</td>
                    <td><span class="table__active_circle ${statusClass}"></span></td>
                    <td>
                        <div class="table__cell_control">
                            <button class="table__edit" style="pointer-events: none;" onclick="openEditForm(${student.id})">
                                <img class="table__icon" src="./assets/img/students-table/edit.svg" alt="Edit">
                            </button>
                            <button class="table__delete" style="pointer-events: none;" onclick="openDeleteForm(${student.id})">
                                <img class="table__icon" src="./assets/img/students-table/delete.svg" alt="Delete">
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = rows;

        // Встановлення початкового стану для кнопки масового видалення
        const deleteMultipleButton = document.querySelector(".table__delete_student");
        if (deleteMultipleButton) {
            deleteMultipleButton.classList.remove("active");
            deleteMultipleButton.style.pointerEvents = "none";
            document.querySelector(".delete_student_describe").textContent = "Delete (0)";
        }

        // Знімаємо головний чекбокс
        const mainCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
        if (mainCheckbox) {
            mainCheckbox.checked = false;
            mainCheckbox.disabled = !isLoggedIn; // Вимикаємо головний чекбокс, якщо не залогінений
        }
    } catch (error) {
        console.error("Помилка:", error);
    }
}

// Завантажуємо студентів при завантаженні сторінки
document.addEventListener("DOMContentLoaded", loadStudents);
