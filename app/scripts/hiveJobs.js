/* jshint strict: false */
/*jslint bitwise: true */
/* global HADOOPOPTS: false */
(function() {
    var data = {};
    var curConf = HADOOPOPTS.getConf();
    data['user.name'] = curConf.user.name;
    data['hive.webhcat.host'] = curConf.hive.webhcat.host;
    data['hive.webhcat.port'] = curConf.hive.webhcat.port;

    $.get('/hive/jobs', data, function(jobs) {
        //console.log(jobs);
        var hiveTable = $('#hive_jobs_table').DataTable({
            data: jobs,
            columns: [{
                className: 'details-control',
                orderable: false,
                data: null,
                defaultContent: ''
            }, {
                data: 'id'
            }],
            order: [
                [1, 'asc']
            ]
        });
        //console.log(hiveTable);
        var jsonOut = '';
        $('#hive_jobs_table tbody').on('click', 'td.details-control', function() {

            var tr = $(this).closest('tr');
            var row = hiveTable.row(tr);

            if (row.child.isShown()) {
                // This row is already open - close it
                row.child.hide();
                tr.removeClass('shown');
            } else {
                // Open this row
                $.get('/hive/job/' + row.data().id, data, function(jobInfo) {
                	jsonOut = '';
                    traverse(jobInfo, process);
                    row.child(jsonOut).show();
                    //row.child(JSON.stringify(jobInfo)).show();
                    tr.addClass('shown');
                });
            }
        });

        var inSection = false;
        function process(key, value) {
            if (value !== null && typeof value === 'object') {
                if (inSection) {
                    jsonOut = jsonOut + '</ul>';
                }
                jsonOut = jsonOut + '<br/><strong>' + key + '</strong><ul>';
                inSection = true;

            } else {
                jsonOut = jsonOut + '<li>' + key + ' : ' + value;
            }
        }

        function traverse(o, func) {
            for (var i in o) {
                func.apply(this, [i, o[i]]);
                if (o[i] !== null && typeof(o[i]) === 'object') {
                    //going on step down in the object tree!!
                    traverse(o[i], func);
                }
            }
        }
    });
})();