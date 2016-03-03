// Function to get classes
function get_classes(to_append) {
	/////////////////////////////////////////////
	//	GETTING CLASS INFORMATION
	/////////////////////////////////////////////
	var class_container = $(to_append),
		data_to_app = "";
	// Getting the classes
	$.get("/classes", function(data) {
		// var data = JSON.parse(data);
		// Checking the data
		if (data.class_data.length < 1) {
			data_to_app = "<tr><td style='text-align: center;'>You haven't created any classes yet!</td></tr>";
		} else if (data.class_data.length > 0) {
			for (var index = 0; index < data.class_data.length; index++) {
				data_to_app += "<tr><td><a href='edit_class/" + data.class_data[index]['id'] + "'>" + data.class_data[index]['class_name'] + "<span class='glyphicon glyphicon-pencil' style='margin-left: 10px; font-size: 0.9em; color: rgba(0, 0, 0, 0.7);'></span></a></td></tr>";
			}
		}
		// Adding the data
		class_container.empty();
		class_container.html(data_to_app);
	});
}

function get_class_list(to_append) {
	var class_container = $(to_append),
		data_to_app = "";
	// Getting the classes
	$.get("/classes", function(data) {
		// var data = JSON.parse(data);
		// Checking the data
		if (data.class_data.length < 1) {
			data_to_app = "<tr><td style='text-align: center;'>You haven't created any classes yet!</td></tr>";
		} else if (data.class_data.length > 0) {
			for (var index = 0; index < data.class_data.length; index++) {
				data_to_app += "<option value='" + data.class_data[index]['id'] + "'>" + data.class_data[index]['class_name'] + "</option>";
			}
		}
		// Adding the data
		class_container.empty();
		class_container.html(data_to_app);
	});
}

// Function to get Tasks
function get_tasks(to_append) {
	/////////////////////////////////////////////
	//	GETTING TASK INFORMATION
	/////////////////////////////////////////////
	var task_container = $(to_append),
		tasks = "";
	// Getting the classes
	$.get("/tasks", function(data) {
		console.log(data);
		// var data = JSON.parse(data);
		// Checking the data
		if (data.task_data.length < 1) {
			tasks = "<tr><td style='text-align: center;'>You haven't set any tasks yet!</td></tr>";
		} else if (data.task_data.length > 0) {
			for (var index = 0; index < data.task_data.length; index++) {
				// Working out if a task is overdue
				var curr_stamp = Date.now(),
					days = day_con(data.task_data[index]['date_due'], curr_stamp),
					// date_due = date('m/d/y', data.task_data[index]['date_due']);
					date_due = "Boobs";

				tasks += "<tr><td><a href='edit_task.php?id=" + data.task_data[index]['id'] + "'>";
				tasks += "<b>" + data.task_data[index]['task_name'] + " - (" + data.task_data[index]['class_name'] + ")</b><span class='glyphicon glyphicon-pencil' style='margin-left: 10px; font-size: 0.9em; color: rgba(0, 0, 0, 0.7);'></span></a>";
				tasks += "<p>" + data.task_data[index]['task_desc'] + "</p>";
				tasks += "<small>Due by: " + date_due + " (" + days + ")</small></td></tr/>";
			}
		}
		// Adding the data
		task_container.empty();
		task_container.html(tasks);
	});
}

// Day conversion function
function day_con(to_comp, curr_stamp) {

	diff_stamp = to_comp - curr_stamp;
	days = Math.ceil(diff_stamp / 60 / 60 / 24);
	day_preview = "";

	if (days < 0) {
		day_preview = "Overdue - by " + Math.abs(days) + " days";
	} else if (days > 1) {
		day_preview = days + " days left";
	} else if (days == 1) {
		day_preview = "Due tomorrow";
	} else if (days == 0) {
		day_preview = "Due today";
	}

	return day_preview;

}

// Function for showing any error messages
function show_noti(stat, msg) {
	// Declaring the ID of the notification box
	var noti_box = $("#show_noti");
	// Checking the status
	switch (stat) {
		case 0:
			noti_box.removeClass("alert-success");
			noti_box.addClass("alert-danger");
			break;
		case 1:
			noti_box.removeClass("alert-danger");
			noti_box.addClass("alert-success");
			break;
		default:
			noti_box.hide();
	}
	// Setting the text
	noti_box.html(msg);
}

// Function for parsing the form data
function form_parse(form) {
	// Serializing the data
	var book_form_data = form.serializeArray(),
		data_obj = {};
	// Pushing the data to an array
	for (var i = 0, l = book_form_data.length; i < l; i++) {
	    data_obj[book_form_data[i].name] = book_form_data[i].value;
	}
	// Returning the object
	return data_obj;
}
