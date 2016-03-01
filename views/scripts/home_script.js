$(document).ready(function() {

	/////////////////////////////////////////////
	//	GETTING CLASS INFORMATION
	/////////////////////////////////////////////
	var class_container = $("#class_table"),
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
		class_container.html(data_to_app);
	});

	/////////////////////////////////////////////
	//	GETTING TASK INFORMATION
	/////////////////////////////////////////////
	var task_container = $("#task_table"),
		tasks = "";
	// Getting the classes
	$.get("/tasks", function(data) {
		// var data = JSON.parse(data);
		// Checking the data
		if (data.task_data.length < 1) {
			data_to_app = "<tr><td style='text-align: center;'>You haven't set any tasks yet!</td></tr>";
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
		task_container.html(tasks);
	});

});