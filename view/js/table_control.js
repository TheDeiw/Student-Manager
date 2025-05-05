document.addEventListener("DOMContentLoaded", async function () {
    const mainCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
    const tbody = document.querySelector(".main_table tbody");
    const deleteMultipleButton = document.querySelector(".table__delete_student");
    const paginationList = document.querySelector(".pagination__list");
    let currentPage = 1;

    // Перевірка стану авторизації
    const isLoggedIn = await checkLoginStatusForTable();

    // Apply initial states to all buttons
    initializeButtonStates(isLoggedIn);

    // Логіка для чекбоксів у рядках
    if (tbody) {
        tbody.addEventListener("change", function (event) {
            if (event.target.matches("input[type='checkbox']")) {
                updateRowButtonsState(event.target);
                updateSelectAllState();
            }
        });
    } else {
        console.error("Table body not found");
    }

    // Логіка для головного чекбокса у заголовку
    if (mainCheckbox) {
        mainCheckbox.addEventListener("change", function () {
            if (!isLoggedIn) return; // Ігноруємо, якщо не залогінений
            const targetState = mainCheckbox.checked;
            const allChildCheckboxes = document.querySelectorAll(".main_table tbody input[type='checkbox']");

            allChildCheckboxes.forEach((checkbox) => {
                checkbox.checked = targetState;
                updateRowButtonsState(checkbox);
            });

            updateSelectAllState();
        });
    } else {
        console.error("Main checkbox not found");
    }

    // Логіка для пагінації
    if (paginationList) {
        paginationList.addEventListener("click", async function (event) {
            const target = event.target.closest(".item__content");
            if (!target) return;

            let newPage = currentPage;
            if (target.classList.contains("pagination__prev") && currentPage > 1) {
                newPage = currentPage - 1;
            } else if (target.classList.contains("pagination__next") && currentPage < window.totalPages) {
                newPage = currentPage + 1;
            } else if (target.classList.contains("pagination__page")) {
                newPage = parseInt(target.textContent);
            }

            if (!isNaN(newPage) && newPage !== currentPage) {
                currentPage = newPage;
                await loadStudents(currentPage);
                updatePagination();
            }
        });
    } else {
        console.error("Pagination list not found");
    }

    // Перевірка стану авторизації
    async function checkLoginStatusForTable() {
        try {
            const response = await fetch("http://localhost/Student-Manager/api/auth/user");
            if (!response.ok) return false;
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error("Помилка перевірки авторизації:", error);
            return false;
        }
    }

    // Ініціалізація стану кнопок при завантаженні сторінки
    function initializeButtonStates(isLoggedIn) {
        const allRows = document.querySelectorAll(".main_table tbody tr");

        allRows.forEach((row) => {
            const checkbox = row.querySelector("input[type='checkbox']");
            const editIcon = row.querySelector(".table__edit .table__icon");
            const deleteIcon = row.querySelector(".table__delete .table__icon");

            if (checkbox) checkbox.disabled = !isLoggedIn; // Вимикаємо чекбокси, якщо не залогінений

            if (editIcon && deleteIcon) {
                // Початковий стан - іконки неактивні
                editIcon.classList.remove("active");
                deleteIcon.classList.remove("active");
            }
        });

        // Ініціалізація кнопки масового видалення
        if (deleteMultipleButton) {
            deleteMultipleButton.classList.remove("active");
            deleteMultipleButton.style.pointerEvents = "none";
        }
        if (mainCheckbox) mainCheckbox.disabled = !isLoggedIn;
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
        if (mainCheckbox) {
            mainCheckbox.checked = numberOfChecked === allChildCheckboxes.length && numberOfChecked > 0;
        }

        // Оновлюємо кнопку масового видалення
        if (deleteMultipleButton) {
            if (numberOfChecked > 0) {
                deleteMultipleButton.classList.add("active");
                deleteMultipleButton.style.pointerEvents = "auto";
            } else {
                deleteMultipleButton.classList.remove("active");
                deleteMultipleButton.style.pointerEvents = "none";
            }
            document.querySelector(".delete_student_describe").textContent = `Delete (${numberOfChecked})`;
        }
    }

    // Оновлення пагінації
    function updatePagination() {
        if (!paginationList) {
            console.error("Pagination list is not available");
            return;
        }

        // Видаляємо старі номери сторінок
        const pageItems = paginationList.querySelectorAll(".pagination__page_item");
        pageItems.forEach((item) => item.remove());

        // Знаходимо кнопки попередньої та наступної сторінок
        const prevButton = paginationList.querySelector(".item__content.pagination__prev");
        const nextButton = paginationList.querySelector(".item__content.pagination__next");

        if (!prevButton || !nextButton) {
            console.error("Previous or Next button not found");
            console.log("prevButton:", paginationList.querySelector(".item__content.pagination__prev"));
            console.log("nextButton:", paginationList.querySelector(".item__content.pagination__next"));
            return;
        }

        // Показуємо всі сторінки (для 9 студентів = 2 сторінки)
        const totalPages = window.totalPages || 1;
        const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

        pageNumbers.forEach((page) => {
            const li = document.createElement("li");
            li.classList.add("pagination_list__item", "pagination__page_item");
            const button = document.createElement("button");
            button.classList.add("item__content", "pagination__page");
            button.textContent = page;
            if (page === currentPage) {
                button.classList.add("active");
            }
            li.appendChild(button);
            paginationList.insertBefore(li, nextButton.parentElement);
        });

        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
        console.log(`Pagination updated: currentPage=${currentPage}, totalPages=${totalPages}`); // Debugging log
    }

    // Завантаження студентів для ініціалізації пагінації
    try {
        await loadStudents(currentPage);
        updatePagination();
    } catch (error) {
        console.error("Failed to load students:", error);
    }
});
