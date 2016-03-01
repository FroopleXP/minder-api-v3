function day_con(to_comp, curr_stamp) {

	diff_stamp = to_comp - curr_stamp;
	days = Math.ceil(diff_stamp / 60 / 60 / 24);
	day_preview = "";

	if (days < 0) {
		day_preview = "Overdue - by " + Math.abs(days) + " days";
	} else if (days > 1) {
		day_preview = days + " days left";
	} else if (days == 1) {
		day_preview = "Due tomorrow";
	} else if (days == 0) {
		day_preview = "Due today";
	}

	return day_preview;
	
}
