async function loadStudents(page = 1) {
    try {
        const response = await fetch(`http://localhost/Student-Manager/api/students?page=${page}&perPage=7`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("API Response:", data); // Debugging log

        const students = data.students || [];
        const isLoggedIn = data.isLoggedIn || false;
        const pagination = data.pagination || {};

        window.currentPage = pagination.currentPage || 1;
        window.totalPages = pagination.totalPages || 1;

        const tableBody = document.querySelector(".main_table tbody");
        if (!tableBody) {
            console.error("Table body not found");
            return;
        }

        let rows = "";
        students.forEach((student) => {
            const statusClass = student.is_online ? "active" : "";
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
        tableBody.innerHTML = rows || "<tr><td colspan='7'>No students found</td></tr>";
        console.log(`Loaded ${students.length} students for page ${page}, totalPages: ${window.totalPages}`);

        const deleteMultipleButton = document.querySelector(".table__delete_student");
        if (deleteMultipleButton) {
            deleteMultipleButton.classList.remove("active");
            deleteMultipleButton.style.pointerEvents = "none";
            document.querySelector(".delete_student_describe").textContent = "Delete (0)";
        }

        const mainCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
        if (mainCheckbox) {
            mainCheckbox.checked = false;
            mainCheckbox.disabled = !isLoggedIn;
        }
    } catch (error) {
        console.error("Помилка при завантаженні студентів:", error);
        const tableBody = document.querySelector(".main_table tbody");
        if (tableBody) {
            tableBody.innerHTML = "<tr><td colspan='7'>Error loading students</td></tr>";
        }
    }
}

document.addEventListener("DOMContentLoaded", () => loadStudents(1));

// Optional: Poll for status updates every 30 seconds
setInterval(() => loadStudents(window.currentPage), 30000);
