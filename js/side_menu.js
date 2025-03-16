const toggleButton = document.querySelector('.menu__icon_arrow')
const sidebar = document.querySelector('.menu__container')
const icon = document.querySelector('.nav_icon')

document.querySelector('.menu__item.arrow').addEventListener('click', toggleSidebar)

function toggleSidebar(){
  sidebar.classList.toggle('close')
  toggleButton.classList.toggle('close')
}

icon.addEventListener('click', (event) => {
  icon.classList.toggle("open");
  sidebar.classList.toggle('active');
});

document.querySelector(".notification_bell").addEventListener("mousedown", function() {
  this.classList.add("clicked");

  // Видаляємо клас після завершення анімації, щоб можна було повторити
  setTimeout(() => {
      this.classList.remove("clicked");
  }, 500); // Час відповідає тривалості анімації
});