/* jshint strict: false */
(function () {
	var curConf = HADOOPOPTS.getConf();

	console.log('hdfsMetaData.js');
	$('#metaDataSearch').keydown(function (event) {
		if (event.keyCode == 13) {
			event.preventDefault();
			doSearch($('#metaDataSearch').val());
		}
	});

	$('#metaDataSearchButton').click(function(event){
		doSearch($('#metaDataSearch').val());
	});

	var doSearch = function(searchStr){
		var query = {'query': searchStr}
		searchStr = encodeURIComponent(searchStr);
		console.log(searchStr);
		//var url = 'http://' + curConf.solr.host + ":" + curConf.solr.port + '/solr/HDFSMetadata/query?q=' + searchStr;

		var url = '/hdfs/metadata/query?server=' + curConf.solr.host + ':' + curConf.solr.port + '/solr/HDFSMetadata/query&q=' + searchStr;

		$.get(url, function(data){
			console.log(data);
		});
	}

	$(".row").mouseover(function(){
		$(this).addClass('active');
	});

	$(".row").mouseout(function(){
		$(this).removeClass('active');
	});
})();
