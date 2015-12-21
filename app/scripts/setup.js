/* jshint strict: false */
/*jslint bitwise: true */
/* global HADOOPOPTS: false */
(function ($) {
	$('#setup_submit_button').hide();
	var conf = JSON.flatten(HADOOPOPTS.getConf());
	var formData = {};
	$('#setupForm').serializeArray().map(function (x) {
		formData[x.name] = x.value;
	});

	for (var prop in conf) {
		try {
			$('[name="' + prop + '"]').val(conf[prop]);
		} catch (err) {
			console.log(err);
			continue;
		}
	}

	$('#setupForm :input').change(function () {
		$('#setup_submit_button').show();
	});

	$('#setupForm input[name="host"]').change(function () {
		$('#myModal').modal();
	});

	$('#confirmChangeHostBtn').click(function () {
		$('#setupForm input[name="hdfs.namenode.host"]').val($('#setupForm input[name="host"]').val());
		$('#setupForm input[name="hive.webhcat.host"]').val($('#setupForm input[name="host"]').val());
		$('#myModal').modal('hide');
	});

	$('#setupForm').submit(function (e) {
		console.log('FIRING');
		e.preventDefault();

		$(this).serializeArray().map(function (x) {
			formData[x.name] = x.value;
		});
		console.log(JSON.unflatten(formData));

		$.post('/setup', JSON.unflatten(formData), function (response) {
			// Set HADOOPOPTS
			console.log(response.statusCode);
			if (response.statusCode === 201) {
				HADOOPOPTS.setConf(JSON.unflatten(formData));
			}
		});
	});
})($);
