/* jshint strict: false */
/* global d3: false */
/* global HADOOPOPTS: false */
(function (_) {
	const GZIP = 'gzip';
	const AVRO = 'avro';
	const SNAPPY = 'snappy';
	const ORC = 'orc';
	const PARQUET = 'parquet';
	const NONE = 'none';

	$('#hdfsBrowserTable, #hdfsFileContentsContainer').hide();
	$('#fileContentTabs a[href="#fileSchemaTab"]').hide();

	var hdfsTable;
	var curConf = HADOOPOPTS.getConf();
	$.templates('metadataTmpl', '#metadataTmpl'); //Register the metaData Template

	$('#fileContentTabs a').click(function (e) {
		e.preventDefault()
		$(this).tab('show')
	})

	var createDataTable = function (tObj) {
		if (hdfsTable !== undefined) {
			hdfsTable.destroy();
		}

		var tableDef = $('#hdfsBrowserTable')
			.DataTable({
				retrieve: true,
				autoWidth: false,
				data: tObj,
				columns: [
					{
						data: 'type',
						width: '5%'
					},
					{
						data: 'name'
          			},
					{
						data: 'length',
						width: '5%'
          			},
					{
						data: 'owner',
						width: '5%'
          			},
					{
						data: 'group',
						width: '5%'
          			},
					{
						data: 'permission',
						width: '5%'
          			}
      			],
				columnDefs: [{
					targets: 5,
					orderable: false
      			}]
			});

		return tableDef;
	};

	curConf.hdfs.curPath = ['/', 'user', curConf.user.name];
	HADOOPOPTS.setConf(curConf);

	var getDir = function (curPath) {
		var url = '/hdfs/dir?server=' + curConf.hdfs.namenode.host + ':' + curConf.hdfs.namenode.port + '/webhdfs/v1&path=' + curPath;
		$.get(url, function (files) {
			var tObj = files.FileStatuses.FileStatus.map(function (file) {
				var typeSpan = '';
				if (file.type === 'DIRECTORY') {
					typeSpan = '<span class="fa fa-folder">';
				} else {
					typeSpan = '<span class="fa fa-file">';
				}

				/**
				 * @TODO: Get this HTML code snippet out of here and into a template
				 **/
				var fileName = '<div class="file-name"><span><a href="#" type="' + file.type + '" path="' + file.pathSuffix + '"><strong>' + file.pathSuffix + '</strong></a></span></div><span class="help-blockmod-time"><small>Updated: ' + new Date(file.modificationTime).toUTCString() + '</small></span>';
				var fileSize = humanFileSize(file.length, true);
				var permission = octal2UnixPerms(file.permission);
				return {
					'type': typeSpan,
					'name': fileName,
					'length': fileSize,
					'owner': file.owner,
					'group': file.group,
					'permission': permission,
					'access': file.accessTime,
					'modification': file.modificationTime
				};
			});
			tObj.unshift({
				'type': '<span class="fa fa-folder">',
				'name': '<a href="#" type="DIRECTORY" path=".."><strong>..</strong></a>',
				'length': '',
				'owner': '',
				'group': '',
				'permission': '',
				'access': '',
				'modification': ''
			});
			hdfsTable = createDataTable(tObj);
			createBreadcrumb();
			$('#hdfsBrowserTable').show();
		});
	};

	var getPathString = function () {
		if (curConf.hdfs.curPath.length === 1)
			return '/';
		else
			return curConf.hdfs.curPath.join('/').substring(1);
	};

	var createBreadcrumb = function () {
		var pathStr = '';
		_.each(curConf.hdfs.curPath, function (path, index) {
			if (index === 0)
				pathStr += ' <a href="#" class="dir-name" index="' + index + '" path="' + path + '">' + path + '</a> ';
			else {
				pathStr += ' <a href="#" class="dir-name" index="' + index + '" path="' + path + '">' + path + '</a> / ';
			}
		});
		$('#curPath').html(pathStr);
	};

	$('#hdfsBrowserTable').on('click', 'a[href=#]', function () {
		if ($(this).attr('type') === 'FILE') { //Selection was a file
			//Get Attributes
			getFileAttributes(getPathString() + '/' + $(this).attr('path'));

		} else { // Selection was a dir
			if ($(this).attr('path') === '..') {
				curConf.hdfs.curPath = curConf.hdfs.curPath.slice(0, curConf.hdfs.curPath.length - 1);
			} else {
				curConf.hdfs.curPath.push($(this).attr('path'));
			}
			HADOOPOPTS.setConf(curConf);
			$('#hdfsFileContentsContainer').hide();
			createBreadcrumb();
			getDir(getPathString());
		}
	});

	$('.breadcrumb').on('click', '#curPath a[href=#]', function () {
		$('#hdfsFileContentsContainer').hide();
		curConf.hdfs.curPath = curConf.hdfs.curPath.slice(0, parseInt($(this).attr('index')) + 1);
		HADOOPOPTS.setConf(curConf);
		//createBreadcrumb();
		getDir(getPathString());
	});

	var getFileContents = function (curPath) {
		$('#fileContentTabs a[href="#fileSchemaTab"]').hide();
		var filename = curPath.split('/');
		filename = filename[filename.length - 1];
		//console.log(filename);
		var fileExtension = filename.substr((~-filename.lastIndexOf(".") >>> 0) + 2);
		//console.log(fileExtension);
		var url = '/hdfs/file/contents?server=' + curConf.hdfs.namenode.host + ':' + curConf.hdfs.namenode.port + '/webhdfs/v1&path=' + curPath;
		$.ajax({
			url: url,
			processData: false,
			beforeSend: function (x) {
				//x.overrideMimeType("text/plain; charset=iso-8859-15")
			},
			success: function (fileData) {
				//console.log(fileData.type);
				if(fileData.type === 'avro'){
					displayAvro(fileData.data);
				}
				else{
					displaySimple(fileData.data)
				}

				$('#fileBinaryContents').HexViewer(toBytes(JSON.stringify(fileData.data)));
				if (Number($('#fileMetaDataDiv span[rawsize]').attr('rawsize')) < fileData.data.length) {
					$('#fileBinaryPagination').hide();
				}
			}
		});
	};

	var toHex = function(fileData){
		var hex = []
		for (var i = 0; i < fileData.length; ++i) {
			bytes.push(fileData.charCodeAt(i));
			hex.push(byteToHex(fileData.charCodeAt(i)));
		}
		//console.log(hex);
		return hex;
	}

	var toBytes = function(fileData){
		//console.log(fileData);
		var bytes = []
		for (var i = 0; i < fileData.length; ++i) {
			bytes.push(fileData.charCodeAt(i));
		}
		//console.log(bytes);
		return bytes;
	}

	var displaySimple = function(data){
		$('#fileTextContents').html('<pre id="fileDataPre"></pre>');
		$('#fileDataPre').text(data);
	}

	var displayAvro = function(data){

		$('#fileSchemaTab').html('<pre class="line-numbers language-javascript"><code class="language-javascript">' + JSON.stringify(data.meta, null, ' ') + '</code></pre>');
		var avroData = '';
		for(var i=0; i<data.data.length; i++){
			//console.log(data.data[i]);
			avroData += JSON.stringify(data.data[i], null, ' ');
		}
		//console.log(avroData);
		$('#fileTextContents').html('<pre class="line-numbers language-javascript"><code class="language-javascript">' + avroData + '</code></pre>');
		$('#fileContentTabs a[href="#fileSchemaTab"]').show();
		Prism.highlightElement($('code')[0]);
		Prism.highlightElement($('code')[1]);
	}

	var getFileAttributes = function (curPath) {
		var url = '/hdfs/file/metadata?server=' + curConf.hdfs.namenode.host + ':' + curConf.hdfs.namenode.port + '/webhdfs/v1&path=' + curPath;
		//console.log(url);
		$.get(url, function (fileData, x, y, z) {
			//console.log(fileData);
			var lastModified = new Date(fileData.FileStatus[0].modificationTime).toLocaleString();
			var size = humanFileSize(fileData.FileStatus[0].length, true);
			var permissions = octal2UnixPerms(fileData.FileStatus[0].permission);
			if (fileData.XAttrs.length == 0) {
				fileData.XAttrs[0] = {
					name: 'None',
					value: ''
				};
			}
			var metadata = {
				lastModified: lastModified,
				rawSize: fileData.FileStatus[0].length,
				size: size,
				permissions: permissions,
				checksum: fileData.FileChecksum.bytes,
				xAttrs: fileData.XAttrs
			}

			var htmlOutput = $.render.metadataTmpl(metadata);
			$('#fileMetaDataDiv').html(htmlOutput);
			$('#hdfsFileContentsContainer').show();
			getFileContents(curPath);
		});
	};

	getDir(getPathString());
})(_);
