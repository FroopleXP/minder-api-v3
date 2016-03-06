$(document).ready(function() {

	// Declaring Variables
	var search_form = $("#student_search");
	var search_results = $("#search_results");
	var currently_enroled = $("#enroled_students");
	var curr_count = $("#curr_count");

	var class_id = $("#class_id").attr("class-id");

	// Setting default value to the search box
	search_results.html("<tr><td><center>Search via a students' Lastname</center></td></tr>");

	// Form submission
	search_form.on('submit', function() {

		// Serializing the form data
		var data = search_form.serializeArray(),
			search_query = data[0].value;

		search_results.html("<tr><td><center><img src='../views/images/loader.gif' height='30px' width='30px'></center></td></tr>");

		// Sending AJAX request
		$.ajax({
			url: '/student-search',
			method: 'GET',
			data: {
				search_query: search_query,
				class_id: class_id
			},
			timeout: 10000,
			success: function(data) {

				// Checking the data response
				if (data.data.length < 1) {
					// There's no data
					search_results.html("<tr><td>There were not results for '" + search_query + "'</td></tr>");

				} else if (data.data.length > 0) {
					// There's data
					var user_data = "";
					for (var index = 0; index < data.data.length; index++) {
						user_data += "<tr><td>" + data.data[index].stu_full_name + "<button class='btn btn-success pull-right' title='Enrol " + data.data[index].stu_full_name + " to this class' data='" + data.data[index].stu_id + "' user_name='" + data.data[index].stu_full_name + "'>Enrol</button></td></tr>";
					}
					// Adding data to search results
					search_results.html(user_data);

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
			method: 'PUT',
			url: '/enroled/' + class_id + '/' + user_id,
			timeout: 5000,
			success: function(data) {

				// if (data.stat == 1) {
				//
				// 	var currently_enroled = $("#enroled_students");
				//
				// 	// Removing the User from the list
				// 	that.parent().fadeOut("2000", function() {
				// 		var curr_count_var = parseInt(curr_count.text());
				// 		var new_count = curr_count_var + 1;
				//
				// 		// Checking if this is the first record
				// 		if (curr_count_var < 1) {
				// 			currently_enroled.empty();
				// 		}
				//
				// 		curr_count.text(new_count);
				//
				// 		// Adding the user to currently enroled
				// 		currently_enroled.prepend("<tr><td>" + data['data']['user_name'] + "<button class='btn btn-danger pull-right' data='" + data['data']['user_id'] + "' title='Remove " + data['data']['user_name'] + " from this class'>Remove</button></td></tr>");
				// 	});
				//
				// } else if (data['stat'] == 0) {
				// 	alert(data['str']);
				// }

				console.log(data);

			},
			error: function(data) {
				alert("There was an error enroling the user, please try again. (Check Log)");
				console.log("Request timed out!");
			}
		});

	});

});
