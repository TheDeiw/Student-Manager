const toggleButton = document.querySelector('.menu__icon_arrow')
const sidebar = document.querySelector('.menu__container')

function toggleSidebar(){
  sidebar.classList.toggle('close')
  toggleButton.classList.toggle('close')
}