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
});