/* jshint strict: false */
/*jslint bitwise: true */
$(document).ready(function() {
    /*****************************
     * Page Init
     *****************************/

    $('#side-menu').metisMenu();

    $('#errorContainer').hide();

    $(window).bind('load resize', function() {
        var topOffset = 50;
        var width = (this.window.innerWidth > 0) ? this.window.innerWidth : this.screen.width;
        if (width < 768) {
            $('div.navbar-collapse').addClass('collapse');
            topOffset = 100; // 2-row-menu
        } else {
            $('div.navbar-collapse').removeClass('collapse');
        }

        var height = ((this.window.innerHeight > 0) ? this.window.innerHeight : this.screen.height) - 1;
        height = height - topOffset;
        if (height < 1) {height = 1;}
        if (height > topOffset) {
            $('#page-wrapper').css('min-height', (height) + 'px');
        }
    });

    var url = window.location;
    var element = $('ul.nav a').filter(function() {
        return this.href === url || url.href.indexOf(this.href) === 0;
    }).addClass('active').parent().parent().addClass('in').parent();
    if (element.is('li')) {
        element.addClass('active');
    }

    /*****************************
     * Action Handlers
     *****************************/
    $('a[href=#settings]').click(function() {
        $('.workspace').load('pages/setup.html');
    });
    $('a[href=#hdfs]').click(function() {
        $('.workspace').load('pages/hdfs.html');
    });
    $('a[href=#hiveTables]').click(function() {
        $('.workspace').load('pages/hiveTables.html');
    });
    $('a[href=#hiveJobs]').click(function() {
        $('.workspace').load('pages/hiveJobs.html');
    });
    $('a[href=#yarn]').click(function() {
        $('.workspace').load('pages/yarn.html');
    });
    $('a[href=#hBase]').click(function() {
        $('.workspace').load('pages/hBase.html');
    });
    $('a[href=#kafka]').click(function() {
        $('.workspace').load('pages/kafka.html');
    });
    $('a[href=#storm]').click(function() {
        $('.workspace').load('pages/storm.html');
    });

    $('#errorContainer').on('showError', function(event, msg) {
        console.log(msg);
        $('#errorMessage').html(msg);
        $('#errorContainer').show();
    });

    $('.workspace').load('pages/setup.html');
    $('body').show();
});

/*****************************
 * Functions
 *****************************/
//http://stackoverflow.com/questions/19098797/fastest-way-to-flatten-un-flatten-nested-json-objects
JSON.flatten = function(data) {
    var result = {};

    function recurse(cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for (var i = 0, l = cur.length; i < l; i++){
                recurse(cur[i], prop ? prop + '.' + i : '' + i);
            }
            if (l === 0){
                result[prop] = [];
            }
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + '.' + p : p);
            }
            if (isEmpty){
                result[prop] = {};
            }
        }
    }
    recurse(data, '');
    return result;
};

JSON.unflatten = function(data) {
    'use strict';
    if (Object(data) !== data || Array.isArray(data)){
        return data;
    }
    var result = {},
        cur, prop, idx, last, temp;
    for (var p in data) {
        cur = result, prop = '', last = 0;
        do {
            idx = p.indexOf('.', last);
            temp = p.substring(last, idx !== -1 ? idx : undefined);
            cur = cur[prop] || (cur[prop] = (!isNaN(parseInt(temp)) ? [] : {}));
            prop = temp;
            last = idx + 1;
        } while (idx >= 0);
        cur[prop] = data[p];
    }
    return result[''];
};

var HADOOPOPTS = HADOOPOPTS | {};
HADOOPOPTS = (function($) {
    var conf = conf | {};
    var init = function() {
        $.get('/setup', function(props) {
            conf = props;
        });
    };

    var getConf = function() {
        return conf;
    };

    var setConf = function(props) {
        conf = props;
    };

    init();
    return {
        getConf: getConf,
        setConf: setConf
    };

})($);