$(document).ready(function() {
	
	var task_form = $("#edit_task");
	var save_button = $("#save_btn");
	var delete_btn = $("#task_delete_button");
	var status = $(".update_status");
	var save_btn = $("#sub");

	// Adding the date picker plugin
	var date_sel = $("#date_picker");
	date_sel.datepicker({
		minDate: 0
	});

	// Listening for click on delete button
	delete_btn.on('click', function() {
		var that = $(this);
		var conf_del = confirm("Are you sure you want to delete this task?");
		if (conf_del) {
			var conf_del_2 = confirm("Are you definitely sure? This action can't be undone!");
			if (conf_del_2) {

				that.html("<tr><td><center><img src='../views/images/loader.gif' height='20px' width='20px'></center></td></tr>");

				var task_id = that.attr('task-id');

				console.log(task_id);

				$.ajax({
					method: 'DELETE',
					url: '/edit-task/' + task_id,
					data: {
						task_id: task_id
					},
					success: function(data) {
						if (data.stat == 1) {
							window.location.replace("/");
						} else if (data.stat == 0) {
							alert(data.str);
							window.location.replace("/");
						}
					},
					error: function(data) {
						alert("There was a problem deleting this task, please try again (Check Log)");
						console.log(data);
					}
				});

			}
		}
	});

	// Disabling the save button
	save_button.attr('disabled', true);

	// Checking if any changes have been made
	task_form.on('input', function() {
		save_button.attr('disabled', false);
	});

	// Checking if date changed 
	date_sel.on('click', function() {
		save_button.attr('disabled', false);
	});

	task_form.on('submit', function() {

		var form = task_form.serialize();
		status.html("<small><i>Saving...</i></small>");
		save_btn.attr('disabled', true);

		var task_id = save_btn.attr('task-id');

		$.ajax({
			method: 'PUT',
			url: '/edit-task/' + task_id,
			timeout: 10000,
			data: form,
			success: function(data) {

				// Checking response
				switch (data.stat) {
					case 1:
						status.html("<small><i>Saved</i></small>");
						window.location.replace("/");
						break;
					case 0:
						alert(data.str);
						save_btn.attr('disabled', false);
						break;
				}

			}, 
			error: function(err) {
				console.log(err);
				alert("Task update request timed out or failed!");
				save_btn.attr('disabled', false);
			}

		});

		return false;

	});

});