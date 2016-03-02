$(document).ready(function() {
	
	var class_form = $("#new_class");
	var status = $(".save_status");
	var save_btn = $("#sub");

	class_form.on('submit', function() {

		var form_data = class_form.serialize();

		save_btn.attr('disabled', true);
		status.html("<small><i>Saving...</i></small>");

		$.ajax({
			method: 'POST',
			url: '/save-class',
			timeout: 10000,
			data: form_data,
			success: function(data) {

				// Checking response
				switch (data.stat) {
					case 1:
						status.html('<small><i>Saved!</i></small>').delay(3000).fadeOut();
						class_form[0].reset();
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
				alert("Class create request timed out or failed!");
			}

		});

		return false;

	});

});