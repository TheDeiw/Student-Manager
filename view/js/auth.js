document.addEventListener("DOMContentLoaded", function () {
    checkLoginStatus();
    setupLoginForm();
    setupLogoutButton();
});

// Перевірка стану авторизації та оновлення інтерфейсу
async function checkLoginStatus() {
    try {
        const response = await fetch("http://localhost/Student-Manager/api/auth/user");
        if (!response.ok) {
            throw new Error("Помилка при отриманні даних");
        }

        const data = await response.json();
        if (data.success) {
            const user = data.user;
            updateUIBasedOnLoginStatus(true, user);
        } else {
            updateUIBasedOnLoginStatus(false);
        }
    } catch (error) {
        console.error("Помилка перевірки стану авторизації:", error);
        updateUIBasedOnLoginStatus(false);
    }
}

// Оновлення інтерфейсу в залежності від статусу авторизації
function updateUIBasedOnLoginStatus(isLoggedIn, user = null) {
    const loginButton = document.querySelector(".login-button");
    const notificationBell = document.querySelector(".account_control__notification");
    const userAccount = document.querySelector(".account_control__user");
    const accountName = document.querySelector(".account__name");
    const addStudentButton = document.querySelector(".table__add_student");
    const deleteMultipleButton = document.querySelector(".table__delete_student");
    const tableEditButtons = document.querySelectorAll(".table__edit");
    const tableDeleteButtons = document.querySelectorAll(".table__delete");

    if (isLoggedIn && user) {
        // Користувач залогінений
        if (loginButton) loginButton.style.display = "none";
        if (notificationBell) notificationBell.style.display = "block";
        if (userAccount) userAccount.style.display = "flex";
        if (accountName) accountName.textContent = `${user.first_name} ${user.last_name}`;
        if (addStudentButton) {
            addStudentButton.style.pointerEvents = "auto";
            addStudentButton.classList.remove("disabled");
            addStudentButton.style.opacity = "1";
            deleteMultipleButton.opacity = "1";
        }

        // Активація кнопок редагування для вибраних рядків
        document.querySelectorAll('.main_table tbody input[type="checkbox"]:checked').forEach((checkbox) => {
            const row = checkbox.closest("tr");
            const editBtn = row.querySelector(".table__edit");
            const deleteBtn = row.querySelector(".table__delete");

            // Включаємо чекбокси
            if (editBtn) editBtn.style.pointerEvents = "auto";
            if (deleteBtn) deleteBtn.style.pointerEvents = "auto";
        });
    } else {
        // Користувач не залогінений
        if (loginButton) loginButton.style.display = "block";
        if (notificationBell) notificationBell.style.display = "none";
        if (userAccount) userAccount.style.display = "none";
        if (accountName) accountName.textContent = "";
        if (addStudentButton) {
            addStudentButton.style.pointerEvents = "none";
            addStudentButton.classList.add("disabled");
            addStudentButton.style.opacity = "0.5";
            deleteMultipleButton.style.opacity = "0.5";
        }

        // Деактивація кнопок редагування та видалення
        tableEditButtons.forEach((btn) => (btn.style.pointerEvents = "none"));
        tableDeleteButtons.forEach((btn) => (btn.style.pointerEvents = "none"));
    }
}

// Відкрити форму логіну
function openLoginForm() {
    const form = document.querySelector(".form__login");
    if (form) form.classList.add("active");
}

// Налаштування форми логіну
function setupLoginForm() {
    const loginForm = document.querySelector(".form__login form");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const loginInput = document.getElementById("login");
            const passwordInput = document.getElementById("password");

            const formData = new FormData();
            formData.append("login", loginInput.value);
            formData.append("password", passwordInput.value);

            try {
                const response = await fetch("http://localhost/Student-Manager/api/auth/login", {
                    method: "POST",
                    body: formData,
                });

                const result = await response.json();

                if (result.success) {
                    // Успішний вхід
                    CloseForm();
                    updateUIBasedOnLoginStatus(true, result.user);
                    loadStudents(); // Перезавантажуємо дані студентів
                } else {
                    // Помилка входу
                    const errorElement = document.querySelector(".form__login .form__error_text");
                    if (errorElement) {
                        errorElement.textContent = result.error || "Помилка автентифікації";
                    }
                    loginInput.classList.add("error");
                    passwordInput.classList.add("error");
                }
            } catch (error) {
                console.error("Помилка при спробі входу:", error);
                const errorElement = document.querySelector(".form__login .form__error_text");
                if (errorElement) {
                    errorElement.textContent = "Помилка з'єднання";
                }
            }
        });
    }
}

// Налаштування кнопки виходу
function setupLogoutButton() {
    const logoutButton = document.querySelector(".logout-link");
    if (logoutButton) {
        logoutButton.addEventListener("click", async function (event) {
            event.preventDefault();
            try {
                const response = await fetch("http://localhost/Student-Manager/api/auth/logout", {
                    method: "POST",
                });
                if (response.ok) {
                    updateUIBasedOnLoginStatus(false);
                    loadStudents(); // Перезавантажуємо дані студентів
                } else {
                    console.error("Помилка при виході");
                }
            } catch (error) {
                console.error("Помилка при виході з системи:", error);
            }
        });
    }
}
