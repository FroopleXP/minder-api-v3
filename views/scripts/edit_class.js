$(document).ready(function() {
	
	var class_form = $("#edit_class");
	var save_button = $("#save_btn");
	var delete_btn = $("#class_delete_button");
	var status = $(".update_status");

	var class_id = $("#class_id").attr("class-id");

	// Listening for click on delete button
	delete_btn.on('click', function() {
		var that = $(this);
		var conf_del = confirm("Are you sure you want to delete this class?");
		if (conf_del) {
			var conf_del_2 = confirm("Are you definitely sure? This action can't be undone!");
			if (conf_del_2) {

				// Adding loading icon
				that.html("<tr><td><center><img src='../views/images/loader.gif' height='20px' width='20px'></center></td></tr>");

				$.ajax({
					method: 'DELETE',
					url: '/classes',
					data: {
						class_id: class_id
					}
					success: function(data) {
						var data = JSON.parse(data);
						if (data['stat'] == 1) {
							window.location.replace("home.php");
						} else if (data['stat'] == 0) {
							alert(data['str']);
						}
					},
					error: function(data) {
						alert("There was a problem deleting this class, please try again (Check Log)");
						console.log(data);
					}
				});

			}
		}
	});

	// Disabling the save button
	save_button.attr('disabled', true);

	// Checking if any changes have been made
	class_form.on('input', function() {
		save_button.attr('disabled', false);
	});

	class_form.on('submit', function() {

		var form = class_form.serializeArray(),
			class_name = form[0]['value'];

		status.html("<small><i>Saving...</i></small>");

		$.ajax({
			method: 'PUT',
			url: '/classes',
			timeout: 10000,
			data: {
				class_name: class_name,
				class_id: class_id
			},
			success: function(data) {

				// Checking response
				switch (data.stat) {
					case 1:
						status.html('<small><i>Saved!</i></small>');
						window.location.replace("home.php");
						break;
					case 0:
						alert(data.str);
						break;
				}

			}, 
			error: function(err) {
				console.log(err);
				alert("Class update request timed out or failed!");
			}

		});

		return false;

	});

});