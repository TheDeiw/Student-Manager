// Checkboxes Logic
document.addEventListener("DOMContentLoaded", function () {
   const mainCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
   const tbody = document.querySelector(".main_table tbody");

   // Делегований обробник для змін дочірніх чекбоксів
   tbody.addEventListener("change", function (event) {
       if (event.target.matches("input[type='checkbox']")) {
           const row = event.target.closest("tr");
           const icons = row.querySelectorAll(".table__icon");
           
           if (event.target.checked) {
               icons.forEach(icon => icon.classList.add("active"));
           } else {
               icons.forEach(icon => icon.classList.remove("active"));
           }
           updateSelectAllState();
       }
   });

   // Обробник для головного чекбокса
   mainCheckbox.addEventListener("change", function () {
       const targetState = mainCheckbox.checked;
       const allChildCheckboxes = document.querySelectorAll(".main_table tbody input[type='checkbox']");

       allChildCheckboxes.forEach(childCheckbox => {
           if (childCheckbox.checked !== targetState) {
               childCheckbox.click();
           }
       });
       updateSelectAllState();
   });
});

function updateSelectAllState() {
   const mainCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
   const allChildCheckboxes = document.querySelectorAll(".main_table tbody input[type='checkbox']");

   const allChecked = [...allChildCheckboxes].every(cb => cb.checked);
   const someChecked = [...allChildCheckboxes].some(cb => cb.checked);

   mainCheckbox.checked = allChecked;
   //mainCheckbox.indeterminate = !allChecked && someChecked;
}

// Form Logic
function CloseForm(){
   let allForms = document.querySelectorAll('.modal_window_style');
   allForms.forEach(form => form.classList.remove('active'));
   ClearInputForms();
}
document.querySelector('.table__add_student').addEventListener('click', function(){
   let form_addStudent = document.querySelector('.form__add_student');
   form_addStudent.classList.toggle('active');
})

function openDeleteStudentForm(newRow){
   let deleteButton = document.querySelector('#delete_student_btn');
   document.querySelector('.form__delete_student').classList.add('active');
   document.querySelector('#delete_name').textContent = newRow.children[2].textContent;

   deleteButton.addEventListener('click', function(){
      newRow.remove();
      CloseForm();
   })
}



// Creating student
function CreateStudent(){
   // Find main elements in table
   let tableBody = document.querySelector('.main_table tbody');
   let newRow = document.createElement('tr');

   // Cool funtcion to create cell
   function createCell(content){
      let td = document.createElement("td");
        if (typeof content === "string") {
            td.textContent = content;
        } else {
            td.appendChild(content);
        }
        return td;
   }

   // Checkbox
   let checkbox = document.createElement("input");
   checkbox.type = "checkbox";
   //checkbox.classList.add("row-checkbox");
   newRow.appendChild(createCell(checkbox));

   // Group
   let groupSelect = document.getElementById('group').value;
   newRow.appendChild(createCell(groupSelect));

   // Name
   let firstNnameInput = document.getElementById('first_name').value;
   let lastNameInput = document.getElementById('last_name').value;
   let nameInput = firstNnameInput + " " + lastNameInput;
   newRow.appendChild(createCell(nameInput));

   // Gender
   let genderSelect = document.getElementById('gender').value;
   newRow.appendChild(createCell(genderSelect));

   // Birthday
   let birthdayInput = document.getElementById('birthday').value;
   newRow.appendChild(createCell(birthdayInput));

   // Status
   let statusSpan = document.createElement("span");
   statusSpan.classList.add("table__active_cirtle");
   newRow.appendChild(createCell(statusSpan));

   // Option
   let optionsDiv = document.createElement("div");
   optionsDiv.classList.add("table__cell_control");

   let editButton = document.createElement("button");
   editButton.classList.add("table__edit");
   let editButtonIcon = document.createElement("img");
   editButtonIcon.src = "img/table/edit.svg";
   editButtonIcon.classList.add("table__icon");
   editButton.appendChild(editButtonIcon);

   let deleteButton = document.createElement("button");
   deleteButton.classList.add("table__delete");
   let deleteButtonIcon = document.createElement("img");
   deleteButtonIcon.src = "img/table/delete.svg";
   deleteButtonIcon.classList.add("table__icon");
   deleteButton.appendChild(deleteButtonIcon);
   deleteButton.addEventListener("click", function (event) {
      let icon = event.target.closest(".table__icon");
      if (icon && icon.classList.contains("active")) { 
         openDeleteStudentForm(newRow);
      }
   });

   optionsDiv.appendChild(editButton);
   optionsDiv.appendChild(deleteButton);
   newRow.appendChild(createCell(optionsDiv));

   // Додаємо рядок у таблицю
   tableBody.appendChild(newRow);
   CloseForm();
}

function ClearInputForms(){
   document.querySelectorAll('input, select').forEach(form => form.value = "");
}
