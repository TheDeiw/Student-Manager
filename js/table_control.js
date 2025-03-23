// Checkboxes Logic
document.addEventListener("DOMContentLoaded", function () {
   const mainCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
   const tbody = document.querySelector(".main_table tbody");

   // Options in table
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

   // Main checkbox
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
   mainCheckbox.checked = allChecked;

   const numberOfChecked = [...allChildCheckboxes].filter(cb => cb.checked).length;
   console.log(numberOfChecked);
   const deleteButton = document.querySelector(".table__delete_student");
   
   if (numberOfChecked == 0){
      deleteButton.classList.toggle("active", false);
      document.querySelector(".delete_student_describe").innerHTML = "Delete (0)";
   } else {
      deleteButton.classList.toggle("active", true);
      document.querySelector(".delete_student_describe").innerHTML = `Delete (${numberOfChecked})`;
   }
   
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
});

function openDeleteStudentForm(newRow){
   let deleteButton = document.querySelector('#delete_student_btn');
   document.querySelector('.form__delete_student').classList.add('active');
   document.querySelector('.form__delete_student_paragraph').textContent = "Are you sure you want to delete user ";
   document.querySelector('#delete_name').textContent = newRow.children[2].textContent;

   deleteButton.addEventListener('click', function(){
      newRow.remove();
      CloseForm();
   })
}

document.querySelector('.table__delete_student').addEventListener("click", function(event) {
   if (this.classList.contains("active")){
      const checkedRows = [...document.querySelectorAll(".main_table tbody input[type='checkbox']")]
      .filter(cb => cb.checked)
      .map(cb => cb.closest("tr"));
      document.querySelector('.form__delete_student').classList.add('active');
      document.querySelector('.form__delete_student_paragraph').textContent = "Are you sure you want do delete all checked students: ";
      document.querySelector('#delete_name').textContent = `${[...document.querySelectorAll(".main_table tbody input[type='checkbox']")].filter(cb => cb.checked).length}`
      document.querySelector('.form__delete_student').classList.add('active');

      let deleteButton = document.querySelector('#delete_student_btn');
      deleteButton.addEventListener('click', function(){
         checkedRows.forEach(row => row.remove());
         updateSelectAllState();
         CloseForm();
      });
   }
});

// Creating student
document.querySelector('#create_student_btn').addEventListener("click", () => {
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

   if (groupSelect == '' || firstNnameInput == '' || lastNameInput == '' || genderSelect == '' || birthdayInput == ''){
      alert("There are empty fields");
      newRow.remove();
      return;
   }

   // Status
   let statusSpan = document.createElement("span");
   statusSpan.classList.add("table__active_cirtle");
   const randomBoolean = Math.random() < 0.5;
   if (randomBoolean){
      statusSpan.classList.add('active');
   }
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

   // Create row
   tableBody.appendChild(newRow);
   CloseForm();
});

function ClearInputForms(){
   document.querySelectorAll('input, select').forEach(form => form.value = "");
}
