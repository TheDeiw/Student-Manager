const toggleButton = document.querySelector('.menu__icon_arrow')
const sidebar = document.querySelector('.menu__container')

document.querySelector('.menu__item.arrow').addEventListener('click', toggleSidebar)

function toggleSidebar(){
  sidebar.classList.toggle('close')
  toggleButton.classList.toggle('close')
}