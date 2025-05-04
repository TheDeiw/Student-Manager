<?php if (session_status() === PHP_SESSION_NONE) {
    session_start();
} ?>
<header class="header">
    <div class="header-container">
        <button class="nav_burger" aria-label="Menu opener">
            <div class="nav_icon">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </button>
        <a href="index.php" class="header__logo">
            <h1>Student Manager</h1>
        </a>
        <div class="header__account_control">
            <?php if (isset($_SESSION['user'])): ?>
                <div class="account_control__notification">
                    <a href="messages.php"><span class="notification_sign active"></span><img class="notification_bell" src="./assets/img/header/Notification-bell.svg" alt="Notification-bell"></a>
                    <div class="notification__messages">
                        <div class="notification__massage">
                            <div class="message__icon"></div>
                            <div class="message__text">
                                <h3 class="message_text__header">Teacher</h3>
                                <p class="message_text__text">Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="account_control__user">
                    <div class="account_control__account">
                        <div class="account__image"><img src="./assets/img/header/Avatar.jpg" alt="" class="account__avatar"></div>
                        <div class="account__name">
                            <?php
                            if (isset($_SESSION['user']['first_name']) && isset($_SESSION['user']['last_name'])) {
                                echo htmlspecialchars($_SESSION['user']['first_name'] . ' ' . $_SESSION['user']['last_name']);
                            } else {
                                echo 'Unknown User';
                            }
                            ?>
                        </div>
                    </div>
                    <div class="account_control__dropdown">
                        <a href="profile.php"><div class="dropdown__item"><img class="dropdown__icon" src="./assets/img/header/Profile.svg" alt="Profile-link">Profile</div></a>
                        <a href="logout.php"><div class="dropdown__item"><img class="dropdown__icon" src="./assets/img/header/Logout.svg" alt="LogOut-link">Log Out</div></a>
                    </div>
                </div>
            <?php else: ?>
                <div class="account_control__notification disabled">
                    <span class="notification_sign"></span><img class="notification_bell" src="./assets/img/header/Notification-bell.svg" alt="Notification-bell">
                </div>
                <button onclick="showLoginModal()">Log In</button>
            <?php endif; ?>
        </div>
    </div>
</header>

<!-- Модальне вікно для входу -->
<div id="loginModal" class="modal_window_style" style="display: none;">
    <div class="modal_window_container">
        <div class="modal_windows__control">
            <h2 class="modal_control__heading">Log In</h2>
            <button onclick="closeLoginModal()" class="modal_control__close">
                <img class="modal_control__close_icon" src="assets/img/modal-windows/close.svg" alt="Close">
            </button>
        </div>
        <form id="loginForm" class="modal_window__form">
            <div class="form__student_group">
                <label for="login" class="form__student_label">Логін (Ім'я Прізвище)</label>
                <input type="text" name="login" id="login" class="form__student_input" required>
                <div class="form__error_text"></div>
            </div>
            <div class="form__student_group">
                <label for="birthday" class="form__student_label">Пароль (Дата народження)</label>
                <input type="date" name="birthday" id="birthday" class="form__student_input" required>
                <div class="form__error_text"></div>
            </div>
            <div class="form__student_buttons">
                <button type="button" onclick="closeLoginModal()" class="form__student_button">Скасувати</button>
                <button type="submit" class="form__student_button">Увійти</button>
            </div>
        </form>
    </div>
</div>

<script>
    function showLoginModal() {
        document.getElementById('loginModal').style.display = 'block';
    }

    function closeLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
        // Очищаємо форму при закритті
        document.getElementById('loginForm').reset();
        document.querySelectorAll('.form__error_text').forEach(el => el.textContent = '');
    }
    
    // Обробка відправки форми входу
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        try {
            const response = await fetch('index.php?action=login', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Перезавантажуємо сторінку при успішному вході
                window.location.reload();
            } else {
                // Показуємо помилку
                document.querySelector('#login').parentElement.querySelector('.form__error_text').textContent = data.error || 'Помилка входу';
            }
        } catch (error) {
            console.error('Error:', error);
            document.querySelector('#login').parentElement.querySelector('.form__error_text').textContent = 'Помилка з'єднання з сервером';
        }
    });
</script>