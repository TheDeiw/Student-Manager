let form_addStudent = document.querySelector('.form__add_student');

function CloseForm(){
	form_addStudent.classList.remove('active');
}

document.querySelector('.table__add_student').addEventListener('click', function(){
	form_addStudent.classList.toggle('active');
})

function toggleCheckboxes() {
	const selectAllCheckbox = document.querySelector(".main_table thead input[type='checkbox']");
	const allCheckboxes = document.querySelectorAll(".main_table tbody .row-checkbox");

	allCheckboxes.forEach(checkbox => {
		 checkbox.checked = selectAllCheckbox.checked;
	});
}

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
	checkbox.classList.add("row-checkbox");
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

	optionsDiv.appendChild(editButton);
	optionsDiv.appendChild(deleteButton);
	newRow.appendChild(createCell(optionsDiv));


	// Додаємо рядок у таблицю
	tableBody.appendChild(newRow);
}