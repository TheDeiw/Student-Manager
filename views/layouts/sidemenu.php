<?php if (session_status() === PHP_SESSION_NONE) {
    session_start();
} ?>
<aside>
    <nav class="menu__container close">
        <ul class="menu__list">
            <li class="menu__item arrow">
                <button id="toggle-btn" class="menu_arrow">
                    <img src="./assets/img/navigation/Arrow.svg" class="menu__icon_arrow close" alt="Menu opener button">
                </button>
            </li>
            <li class="menu__item">
                <a href="dashboard.php" class="menu__link">
                    <img class="menu__icon" src="./assets/img/navigation/Dashboard.svg" alt="Icon - link to page 'Dashboard'">
                    <span>Dashboard</span>
                </a>
            </li>
            <li class="menu__item selected">
                <a href="index.php" class="menu__link">
                    <img class="menu__icon" src="./assets/img/navigation/Students.svg" alt="Icon - link to page 'Students'">
                    <span>Students</span>
                </a>
            </li>
            <li class="menu__item <?php echo !isset($_SESSION['user']) ? 'disabled' : ''; ?>">
                <a href="tasks.php" class="menu__link">
                    <img class="menu__icon" src="./assets/img/navigation/Tasks.svg" alt="Icon - link to page 'Tasks'">
                    <span>Tasks</span>
                </a>
            </li>
        </ul>
    </nav>
</aside>