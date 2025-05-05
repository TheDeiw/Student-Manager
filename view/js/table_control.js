document.addEventListener("DOMContentLoaded", function () {
    const mainCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
    const tbody = document.querySelector(".main_table tbody");
    const deleteMultipleButton = document.querySelector(".table__delete_student");

    // Apply initial states to all buttons
    initializeButtonStates();

    // Логіка для чекбоксів у рядках
    tbody.addEventListener("change", function (event) {
        if (event.target.matches("input[type='checkbox']")) {
            updateRowButtonsState(event.target);
            updateSelectAllState();
        }
    });

    // Логіка для головного чекбокса у заголовку
    mainCheckbox.addEventListener("change", function () {
        const targetState = mainCheckbox.checked;
        const allChildCheckboxes = document.querySelectorAll(".main_table tbody input[type='checkbox']");

        allChildCheckboxes.forEach((checkbox) => {
            checkbox.checked = targetState;
            updateRowButtonsState(checkbox);
        });

        updateSelectAllState();
    });

    // Ініціалізація стану кнопок при завантаженні сторінки
    function initializeButtonStates() {
        const allRows = document.querySelectorAll(".main_table tbody tr");

        allRows.forEach((row) => {
            const checkbox = row.querySelector("input[type='checkbox']");
            const editIcon = row.querySelector(".table__edit .table__icon");
            const deleteIcon = row.querySelector(".table__delete .table__icon");

            if (editIcon && deleteIcon) {
                // Початковий стан - іконки неактивні
                editIcon.classList.remove("active");
                deleteIcon.classList.remove("active");
            }
        });

        // Ініціалізація кнопки масового видалення
        deleteMultipleButton.classList.remove("active");
    }

    // Оновлення стану іконок для конкретного рядка
    function updateRowButtonsState(checkbox) {
        const row = checkbox.closest("tr");
        const editIcon = row.querySelector(".table__edit .table__icon");
        const deleteIcon = row.querySelector(".table__delete .table__icon");
        const editButton = row.querySelector(".table__edit");
        const deleteButton = row.querySelector(".table__delete");

        if (editIcon && deleteIcon) {
            if (checkbox.checked) {
                // Активуємо іконки, якщо чекбокс відмічений
                editIcon.classList.add("active");
                deleteIcon.classList.add("active");

                // Забезпечуємо, щоб кнопки працювали
                editButton.style.pointerEvents = "auto";
                deleteButton.style.pointerEvents = "auto";
            } else {
                // Деактивуємо іконки, якщо чекбокс знятий
                editIcon.classList.remove("active");
                deleteIcon.classList.remove("active");

                // Забезпечуємо, щоб кнопки не працювали
                editButton.style.pointerEvents = "none";
                deleteButton.style.pointerEvents = "none";
            }
        }
    }

    // Оновлення стану головного чекбокса та кнопки видалення
    function updateSelectAllState() {
        const allChildCheckboxes = document.querySelectorAll(".main_table tbody input[type='checkbox']");
        const numberOfChecked = [...allChildCheckboxes].filter((cb) => cb.checked).length;

        // Оновлюємо головний чекбокс: вибраний, якщо всі рядки вибрані
        mainCheckbox.checked = numberOfChecked === allChildCheckboxes.length && numberOfChecked > 0;

        // Оновлюємо кнопку масового видалення
        if (numberOfChecked > 0) {
            deleteMultipleButton.classList.add("active");
            deleteMultipleButton.style.pointerEvents = "auto";
        } else {
            deleteMultipleButton.classList.remove("active");
            deleteMultipleButton.style.pointerEvents = "none";
        }

        document.querySelector(".delete_student_describe").textContent = `Delete (${numberOfChecked})`;
    }
});
