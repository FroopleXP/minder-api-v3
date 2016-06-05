$(document).ready(function() {

	var pass_change_form = $("#pass_change_form");
    var change_btn = $("#pass_change");

	pass_change_form.on('submit', function() {

        change_btn.attr('disabled', true);
        change_btn.text("Changing Password...");

		var form = pass_change_form.serialize();

        $.ajax({
            method: 'POST',
            url: '/change-password',
            timeout: 10000,
            data: form,
            success: function(data) {
				switch (data.status) {
					case 1:

						pass_change_form[0].reset();
						alert("Your Password has been changed successfully. Please log back in by clicking 'Ok'");
						window.location.replace("logout");

						break;
					case 0:

                        // Resetting Password button
						alert(data.message);
                        change_btn.attr('disabled', false);
                        change_btn.text("Change Password");

						break;
				}
            },
            error: function(data) {

                alert("Password change request timed out or failed!");

                // Resetting Password button
                change_btn.attr('disabled', false);
                change_btn.text("Change Password");
            }
        });

        return false;

    });

});
