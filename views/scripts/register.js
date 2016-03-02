// waiting for page to load
$(document).ready(function() {
	// Configuring the form ready for submission
	var reg_form = $('#register');
	// Listening for submission
	reg_form.on('submit', function() {
		// Getting the form data
		var reg_data = form_parse(reg_form),
			reg_btn = $("#reg_btn");

		// Disabling the button
		reg_btn.attr('disabled', true);
		reg_btn.text("Registering...");

		// Sending the data to the server
		$.ajax({
			method: 'POST',
			url: '/register',
			dataType: 'JSON',
			timeout: 10000,
			data: {
				form_data: reg_data
			},
			success: function(data) {
				// Parsing the response
				// var res = JSON.parse(data);
				// Checking the data
				switch (data['stat']) {
					case 0:
						show_noti(0, data['message']);
						// Resetting the Button
						reg_btn.attr('disabled', false);
						reg_btn.text("Register");
						break;
					case 1:
						reg_form.trigger("reset");
						show_noti(1, data['message']);
						reg_btn.attr('disabled', false);
						reg_btn.text("Register");
						break;
				}
			}, 
			error: function(err) {
				// Resetting the Button
				reg_btn.attr('disabled', false);
				reg_btn.text("Register");
				// Notifying that there has been an error
				show_noti(0, "<strong>Oops!</strong> Something went wrong. Please try again later...");
				console.log(err);
			}
		});
		// Stopping the form from submittin
		return false;
	});
});