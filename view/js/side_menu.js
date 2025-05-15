const toggleButton = document.querySelector(".menu__icon_arrow");
const sidebar = document.querySelector(".menu__container");
const icon = document.querySelector(".nav_icon");

document.querySelector(".menu__item.arrow").addEventListener("click", function () {
    sidebar.classList.toggle("close");
    toggleButton.classList.toggle("close");
});

icon.addEventListener("click", () => {
    icon.classList.toggle("open");
    sidebar.classList.toggle("close");
});

document.querySelector(".notification_bell").addEventListener("mousedown", function () {
    this.classList.add("clicked");

    setTimeout(() => {
        this.classList.remove("clicked");
    }, 500);
});

const redSign = document.querySelector(".notification_sign");
document.querySelector(".notification_bell").addEventListener("click", function () {
    redSign.classList.toggle("active");
});

document.addEventListener("DOMContentLoaded", function () {
    setupSideMenu();
});

function setupSideMenu() {
    const navBurger = document.querySelector(".nav_burger");
    const menu = document.querySelector(".menu__container");
    const toggleBtn = document.getElementById("toggle-btn");

    if (navBurger) {
        navBurger.addEventListener("click", function () {
            menu.classList.toggle("close");
        });
    }

    if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
            menu.classList.toggle("close");
            document.querySelector(".menu__icon_arrow").classList.toggle("close");
        });
    }
}

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
