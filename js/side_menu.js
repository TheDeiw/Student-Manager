const toggleButton = document.querySelector(".menu__icon_arrow");
const sidebar = document.querySelector(".menu__container");
const icon = document.querySelector(".nav_icon");

document
  .querySelector(".menu__item.arrow")
  .addEventListener("click", function () {
    sidebar.classList.toggle("close");
    toggleButton.classList.toggle("close");
  });

icon.addEventListener("click", () => {
  icon.classList.toggle("open");
  sidebar.classList.toggle("close");
});

document
  .querySelector(".notification_bell")
  .addEventListener("mousedown", function () {
    this.classList.add("clicked");

    setTimeout(() => {
      this.classList.remove("clicked");
    }, 500);
  });

const redSign = document.querySelector(".notification_sign");
document
  .querySelector(".notification_bell")
  .addEventListener("click", function () {
    redSign.classList.toggle("active");
  });
