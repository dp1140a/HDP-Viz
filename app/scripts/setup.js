/* jshint strict: false */
/*jslint bitwise: true */
/* global HADOOPOPTS: false */
(function($) {
    $('#setup_submit_button').hide();
    var conf = JSON.flatten(HADOOPOPTS.getConf());
    var formData = {};
    $('#setupForm').serializeArray().map(function(x) {
        formData[x.name] = x.value;
    });

    for (var prop in conf) {
        try {
            $('[name="' + prop + '"]').val(conf[prop]);
        } catch (err) {continue;}
    }

    $('#setupForm :input').change(function() {
        $('#setup_submit_button').show();
    });

    $('#setupForm').submit(function(e) {
        console.log('FIRING');
        e.preventDefault();

        $(this).serializeArray().map(function(x) {
            //console.log(x);
            formData[x.name] = x.value;
        });
        console.log(formData);

        $.post('/setup', formData, function(response) {
            // Set HADOOPOPTS
            console.log(response.statusCode);
            if(response.statusCode === 201){
                HADOOPOPTS.setConf(formData);
            }
        });
    });
})($);