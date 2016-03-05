$(document).ready(function() {

	// Declaring Variables
	var search_form = $("#student_search");
	var search_results = $("#search_results");
	var currently_enroled = $("#enroled_students");
	var curr_count = $("#curr_count");

	// Setting default value to the search box
	search_results.html("<tr><td><center>Search via a students' Lastname</center></td></tr>");

	// Form submission
	search_form.on('submit', function() {

		// Serializing the form data
		var data = search_form.serialize(),
			class_id = $("#class_id").attr("class-id");

		search_results.html("<tr><td><center><img src='../views/images/loader.gif' height='30px' width='30px'></center></td></tr>");

		// Sending AJAX request
		$.ajax({
			url: 'php/search_script.php',
			method: 'GET',
			data: {
				search_query: data,
				class_id: class_id
			},
			timeout: 10000,
			success: function(data) {
				var res = JSON.parse(data);
				if (res['stat'] == 1) {
					
					// To append to the table
					var users = "";

					// Looping through the data
					$.each(res['data'], function(i, itm) {
						users += "<tr><td>" + itm['user_name'] + "<button class='btn btn-success pull-right' title='Enrol " + itm['user_name'] + " to this class' data='" + itm['user_id'] + "' user_name='" + itm['user_name'] + "'>Enrol</button></td></tr>";
					});

					// Appending results to the table
					search_results.html(users);

				} else {
					search_results.html("<tr><td><center>" + res['str'] + "</center></td></tr>");
				}
			}, 
			error: function(data) {
				console.log(data);
				alert("There was an error getting search results (see log)");
			}
		});

		return false;

	});

	// Listening for click on remove button
	currently_enroled.delegate('button', 'click', function() {

		// Getting the user's information
		var to_remove_id = $(this).attr('data');
		var that = $(this);

		// Adding loading icon
		$(this).html("<tr><td><center><img src='../views/images/loader.gif' height='20px' width='20px'></center></td></tr>");

		// Removing the user
		$.ajax({
			method: 'POST',
			url: 'php/remove_user_from_class_script.php',
			data: {
				user_id: to_remove_id
			},
			timeout: 5000,
			success: function(data) {
				var data = JSON.parse(data);
				if (data['stat'] == 1) {

					that.parent().fadeOut("2000", function() {
						var curr_count_var = parseInt(curr_count.text());
						var new_count = curr_count_var - 1;
						if (new_count == 0) {
							$("#enroled_students").prepend("<tr><td>No students enroled</td></tr>");
						}
						curr_count.text(new_count);
					});

				} else if (data['stat'] == 0) {
					alert(data['str']);
				}
			},
			error: function(data) {
				alert("Request to remove user has failed or timed out! (Check log)");
				console.log(data);
			}
		});

	});

	// Listening for click on enrol button
	search_results.delegate('button', 'click', function() {

		// Adding the user to the class
		var user_id = $(this).attr('data');
		var user_name = $(this).attr('user_name');
		var that = $(this);

		// Adding loading icon to enrol button
		$(this).html("<tr><td><center><img src='../views/images/loader.gif' height='20px' width='20px'></center></td></tr>");

		// Sending AJAX request
		$.ajax({
			method: 'POST',
			url: 'php/add_user_to_class_script.php',
			data: {
				user_id: user_id,
				user_name: user_name
			},
			timeout: 5000,
			success: function(data) {
				var data = JSON.parse(data);
				if (data['stat'] == 1) {

					var currently_enroled = $("#enroled_students");

					// Removing the User from the list
					that.parent().fadeOut("2000", function() {
						var curr_count_var = parseInt(curr_count.text());
						var new_count = curr_count_var + 1;

						// Checking if this is the first record
						if (curr_count_var < 1) {	
							currently_enroled.empty();
						}

						curr_count.text(new_count);

						// Adding the user to currently enroled
						currently_enroled.prepend("<tr><td>" + data['data']['user_name'] + "<button class='btn btn-danger pull-right' data='" + data['data']['user_id'] + "' title='Remove " + data['data']['user_name'] + " from this class'>Remove</button></td></tr>");
					});

				} else if (data['stat'] == 0) {
					alert(data['str']);
				}
			},
			error: function(data) {
				alert("There was an error enroling the user, please try again. (Check Log)");
				console.log("Request timed out!");
			}
		});

	});

});