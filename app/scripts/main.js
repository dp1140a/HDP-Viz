/* jshint strict: false */
/*jslint bitwise: true */
$(document).ready(function () {
	/*****************************
	 * Page Init
	 *****************************/
	$('.workspace').load('pages/setup.html');
	$('#side-menu').metisMenu();

	$('#errorContainer').hide();
	$(document).ajaxError(function (event, jqxhr, settings, thrownError) {
		$('#errorMessage').html('<p><strong>Oops!  Looks like something went wrong. I got ' + event.type + '.</p>Server Response:</strong><br/>' + jqxhr.statusText + '<br/>' + jqxhr.responseText);
		$('#errorContainer').show();
	});

	$(window).bind('load resize', function () {
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
		if (height < 1) {
			height = 1;
		}
		if (height > topOffset) {
			$('#page-wrapper').css('min-height', (height) + 'px');
		}
	});

	var url = window.location;
	var element = $('ul.nav a').filter(function () {
		return this.href === url || url.href.indexOf(this.href) === 0;
	}).addClass('active').parent().parent().addClass('in').parent();
	if (element.is('li')) {
		element.addClass('active');
	}

	/*****************************
	 * Action Handlers
	 *****************************/
	$('a[href=#settings]').click(function () {
		$('.workspace').load('pages/setup.html');
	});
	$('a[href=#hdfsBrowser]').click(function () {
		$('.workspace').load('pages/hdfsBrowser.html');
	});
	$('a[href=#hdfsMetaData]').click(function () {
		$('.workspace').load('pages/hdfsMetaData.html');
	});
	$('a[href=#hdfsReports]').click(function () {
		$('.workspace').load('pages/hdfsReports.html');
	});
	$('a[href=#hdfsViz]').click(function () {
		$('.workspace').load('pages/hdfs.html');
	});
	$('a[href=#hiveTables]').click(function () {
		$('.workspace').load('pages/hiveTables.html');
	});
	$('a[href=#hiveJobs]').click(function () {
		$('.workspace').load('pages/hiveJobs.html');
	});
	$('a[href=#yarn]').click(function () {
		$('.workspace').load('pages/yarn.html');
	});
	$('a[href=#hBase]').click(function () {
		$('.workspace').load('pages/hBase.html');
	});
	$('a[href=#kafka]').click(function () {
		$('.workspace').load('pages/kafka.html');
	});
	$('a[href=#storm]').click(function () {
		$('.workspace').load('pages/storm.html');
	});

	$('#errorContainer').on('showError', function (event, msg) {
		console.log(msg);
		$('#errorMessage').html(msg);
		$('#errorContainer').show();
	});
	$('body').show();
});

/*****************************
 * Functions
 *****************************/
 if (typeof String.prototype.endsWith !== 'function') {
     String.prototype.endsWith = function(suffix) {
         return this.indexOf(suffix, this.length - suffix.length) !== -1;
     };
 }

function byteToHex(b) {
	var hexChar = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
	return hexChar[(b >> 4) & 0x0f] + hexChar[b & 0x0f];
}

function octal2UnixPerms(octalPerm) {
	var tArr = octalPerm.split('');
	//console.log(tArr);
	var permStr = '-';
	for (var perm in tArr) {
		switch (tArr[perm]) {
		case '0':
			permStr += '---';
			break;
		case '1':
			permStr += '--x';
			break;
		case '2':
			permStr += '-w-';
			break;
		case '3':
			permStr += '-wx';
			break;
		case '4':
			permStr += 'r--';
			break;
		case '5':
			permStr += 'r-x';
			break;
		case '6':
			permStr += 'rw-';
			break;
		case '7':
			permStr += 'rwx';
			break;
		}
		//console.log(perm + ": " + permStr);
	}
	return permStr;
}

//http://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable
function humanFileSize(bytes, si) {
	var thresh = si ? 1000 : 1024;
	if (Math.abs(bytes) < thresh) {
		return bytes + ' B';
	}
	var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
	var u = -1;
	do {
		bytes /= thresh;
		++u;
	} while (Math.abs(bytes) >= thresh && u < units.length - 1);
	return bytes.toFixed(1) + ' ' + units[u];
}

//http://stackoverflow.com/questions/19098797/fastest-way-to-flatten-un-flatten-nested-json-objects
JSON.flatten = function (data) {
	var result = {};

	function recurse(cur, prop) {
		if (Object(cur) !== cur) {
			result[prop] = cur;
		} else if (Array.isArray(cur)) {
			for (var i = 0, l = cur.length; i < l; i++) {
				recurse(cur[i], prop ? prop + '.' + i : '' + i);
			}
			if (l === 0) {
				result[prop] = [];
			}
		} else {
			var isEmpty = true;
			for (var p in cur) {
				isEmpty = false;
				recurse(cur[p], prop ? prop + '.' + p : p);
			}
			if (isEmpty) {
				result[prop] = {};
			}
		}
	}
	recurse(data, '');
	return result;
};

JSON.unflatten = function (data) {
	'use strict';
	if (Object(data) !== data || Array.isArray(data)) {
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
HADOOPOPTS = (function ($) {
	var conf = conf | {};
	var init = function () {
		$.get('/setup', function (props) {
			conf = props;
		});
	};

	var getConf = function () {
		return conf;
	};

	var setConf = function (props) {
		conf = props;
	};

	init();
	return {
		getConf: getConf,
		setConf: setConf
	};

})($);
