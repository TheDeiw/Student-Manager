document.addEventListener("DOMContentLoaded", function () {
    setupSideMenu();
});

function setupSideMenu() {
    const navBurger = document.querySelector(".nav_burger");
    const menu = document.querySelector(".menu__container");
    const toggleBtn = document.querySelector(".menu_arrow");
    const menuArrow = document.querySelector(".menu__icon_arrow");
    const navIcon = document.querySelector(".nav_icon");

    // Function to toggle menu
    function toggleMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        menu.classList.toggle("close");
        if (menuArrow) {
            menuArrow.classList.toggle("close");
        }
        if (navIcon) {
            navIcon.classList.toggle("open");
        }
    }

    // Add click event to nav burger
    if (navBurger) {
        navBurger.addEventListener("click", toggleMenu);
    }

    // Add click event to toggle button
    if (toggleBtn) {
        toggleBtn.addEventListener("click", toggleMenu);
    }

    // Add click event to arrow menu item
    const arrowMenuItem = document.querySelector(".menu__item.arrow");
    if (arrowMenuItem) {
        arrowMenuItem.addEventListener("click", toggleMenu);
    }

    // Add click event to nav icon
    if (navIcon) {
        navIcon.addEventListener("click", toggleMenu);
    }
}

// Notification bell functionality
document.addEventListener("DOMContentLoaded", function () {
    const notificationBell = document.querySelector(".notification_bell");
    const redSign = document.querySelector(".notification_sign");

    if (notificationBell) {
        // Add mousedown effect
        notificationBell.addEventListener("mousedown", function () {
            this.classList.add("clicked");
            setTimeout(() => {
                this.classList.remove("clicked");
            }, 500);
        });

        // Add click effect for notification sign
        if (redSign) {
            notificationBell.addEventListener("click", function () {
                redSign.classList.toggle("active");
            });
        }
    }
});

// Form handling functions
function openNewChatForm() {
    const form = document.querySelector(".form__new_chat");
    if (form) {
        form.classList.add("active");
    }
}

function CloseForm() {
    const forms = document.querySelectorAll(".modal_window_style");
    forms.forEach((form) => {
        form.classList.remove("active");
    });
}
