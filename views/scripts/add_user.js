$(document).ready(function() {

	var user_form = $("#user_form");
	var status = $(".save_status");
	var save_btn = $("#sub");

	user_form.on('submit', function() {

		var form_data = user_form.serialize();

		save_btn.attr('disabled', true);
		status.html("<small><i>Saving...</i></small>");

		$.ajax({
			method: 'POST',
			url: '/new-user',
			timeout: 10000,
			data: form_data,
			success: function(data) {

				// Checking response
				switch (data.stat) {
					case 1:
						status.html('<small><i>Saved!</i></small>').delay(3000).fadeOut();
						user_form[0].reset();
						window.location.replace("/");
						break;
					case 0:
						alert(data.message);
						save_btn.attr('disabled', false);
						status.html('');
						break;
				}

			},
			error: function(err) {
				console.log(err);
				save_btn.attr('disabled', false);
				alert("User create request timed out or failed!");
			}

		});

		return false;

	});

});
