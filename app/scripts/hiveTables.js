/* jshint strict: false */
/*jslint bitwise: true */
/* global HADOOPOPTS: false */
/**
 *	Ajax Loader Ref -- http://w3lessons.info/2014/01/26/showing-busy-loading-indicator-during-an-ajax-request-using-jquery/
 *
 **/
if (!tObj) {
    var tObj = [];
}

if (!dbDropdown) {
    var dbDropdown = {};
}

(function() {
    /***************************
     *	Creation Functions
     ***************************/

    var columnTableHTML = '<table class="table table-striped table-bordered table-hover"><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody></tbody></table>';
    var createDataTable = function(tObj) {
        var hiveTable = $('#hive_db_tables').DataTable({
            retrieve: true,
            data: tObj,
            columns: [{
                className: 'details-control',
                orderable: false,
                data: null,
                defaultContent: ''
            }, {
                data: 'name'
            }],
            order: [
                [1, 'asc']
            ]
        });

        $('#hive_db_tables tbody').on('click', 'td.details-control', function() {
            var tr = $(this).closest('tr');
            var row = hiveTable.row(tr);

            if (row.child.isShown()) {
                // This row is already open - close it
                row.child.hide();
                tr.removeClass('shown');
            } else {
                // Open this row
                $.get('/hive/database/' + dbDropdown.selected + '/table/' + row.data().name, formData, function(tableInfo) {
                	var rowId = 'row_' + row.index() + '_columns'
                	var columnTable = $(columnTableHTML).attr('id', rowId);
                	row.child(columnTable).show();
                    $('#'+rowId).DataTable({
                        data: tableInfo.columns,
                        searching: false,
                        paging: false,
                        columns: [{
                            data: 'name'
                        }, {
                            data: 'type'
                        }],
                        order: [
                            [1, 'asc']
                        ]
                    });
                });

            }
        });

        return hiveTable;
    };


    var createDBDropdown = function() {
        $('#hiveDB_Select').html('');
        $('#hiveDB_Select').append($('<option>').text('Select DB')).val('');
        $.each(dbDropdown.databases, function(index, value) {
            $('#hiveDB_Select').append($('<option>').text(value).attr('value', value));
        });
        if (dbDropdown.selected) {
            $('#hiveDB_Select').val(dbDropdown.selected);
        }
    };

    /***************************
     *	Init
     ***************************/
    $('.dataTable_wrapper').hide();
    $('#dbSelectGroup').hide();

    var formData = {};
    var curConf = HADOOPOPTS.getConf();
    formData['user.name'] = curConf.user.name;
    formData['hive.webhcat.host'] = curConf.hive.webhcat.host;
    formData['hive.webhcat.port'] = curConf.hive.webhcat.port;

    if (tObj.length > 0) {
        createDataTable(tObj);
        $('.dataTable_wrapper').show();
    }

    if (!$.isEmptyObject(dbDropdown)) {
        createDBDropdown();
        $('#dbSelectGroup').show();
    }

    /***************************
     *	Ajax Loader
     ***************************/
    var ajaxLoaderStop = function() {
        //jQuery('#resultLoading .bg').height('100%');
        jQuery('#resultLoading').fadeOut(300);
        jQuery('body').css('cursor', 'default');
        $('#resultLoading').remove();
    };

    var ajaxLoaderStart = function(containerDiv, text) {
        if ($('#' + containerDiv).find('#resultLoading').attr('id') !== 'resultLoading') {
            $('#' + containerDiv).append('<div id="resultLoading"><div><img src="images/ajax_loader_green_64.gif"><p>' + text + '</p></div></div>');
        }

        //jQuery('#resultLoading .bg').height('100%');
        jQuery('#resultLoading').fadeIn(300);
        jQuery('body').css('cursor', 'wait');
    };

    $(document).ajaxStart(function() {
        //show ajax indicator
        ajaxLoaderStart('hivePanel', 'loading data.. please wait..');
    }).ajaxStop(function() {
        //hide ajax indicator
        ajaxLoaderStop();
    });


    /***************************
     *	Handlers
     ***************************/

    /*
     *	Get the list of Databases and set Dropdown
     */
    $('#hiveForm').submit(function(e) {
        e.preventDefault();

        $.get('/hive/database', formData, function(dbs) {
            dbDropdown.databases = dbs.databases;
            createDBDropdown()
            $('#dbSelectGroup').show();
        });
    });

    /*
     *	Get the list of Tables form Selected DB and create Data Table
     */
    $('#hiveDB_Select').change(function(e) {
        formData.hiveDB = $(this).val();
        dbDropdown.selected = $(this).val();
        $.get('/hive/database/tables', formData, function(tables) {
          console.log(tables);
            tObj = tables.tables.map(function(table) {
                return {
                    'name': table
                };
            });
            console.log(tObj);
            var hiveTable = createDataTable(tObj);
            $('.dataTable_wrapper').show();
        });
    });
})();
