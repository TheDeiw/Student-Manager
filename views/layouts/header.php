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
        <a href="" class="header__logo">
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
                        <div class="account__name"><?php echo htmlspecialchars($_SESSION['user']['username']); ?></div>
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