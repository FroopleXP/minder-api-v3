$(document).ready(function() {
	
	var task_form = $("#new_task");
	var status = $(".save_status");
	var save_btn = $("#sub");

	task_form.on('submit', function() {

		var form = task_form.serialize();
		var save_btn = $("#sub");

		save_btn.attr('disabled', true);
		status.html("<small><i>Saving...</i></small>");

		$.ajax({
			method: 'POST',
			url: '/save-task',
			timeout: 10000,
			data: form,
			success: function(data) {

				// Checking response
				switch (data.stat) {
					case 1:
						status.html('<small><i>Saved!</i></small>').delay(3000).fadeOut();
						task_form[0].reset();
						window.location.replace("/");
						break;
					case 0:
						alert(data.str);
						save_btn.attr('disabled', false);
						status.html('');
						break;
				}

			}, 
			error: function(err) {
				console.log(err);
				save_btn.attr('disabled', false);
				alert("Task save request timed out or failed!");
			}

		});

		return false;

	});

});