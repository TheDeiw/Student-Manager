let form_addStudent = document.querySelector('.form__add_student');

function CloseForm(){
	form_addStudent.classList.remove('active');
}

document.querySelector('.table__add_student').addEventListener('click', function(){
	form_addStudent.classList.toggle('active');

	let tableBody = document.querySelector('.main_table tbody');

	let newRow = document.createElement('tr');

	function createCell(content){
		let td = document.createElement("td");
        if (typeof content === "string") {
            td.textContent = content;
        } else {
            td.appendChild(content);
        }
        return td;
	}

	// 1️⃣ Checkbox
	let checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	newRow.appendChild(createCell(checkbox));

	// 2️⃣ Group
	newRow.appendChild(createCell("Group 2"));

	// 3️⃣ Name
	newRow.appendChild(createCell("Newsaaaaaaaaaaaaaaaaa User"));

	// 4️⃣ Gender
	newRow.appendChild(createCell("M"));

	// 5️⃣ Birthday
	newRow.appendChild(createCell("15.05.1995"));

	// 6️⃣ Status (Активний круг)
	let statusSpan = document.createElement("span");
	statusSpan.classList.add("table__active_cirtle");
	newRow.appendChild(createCell(statusSpan));

	// 7️⃣ Option (Кнопки Редагувати / Видалити)
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

})