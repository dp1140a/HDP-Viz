/* jshint strict: false */
console.log(process.cwd());
console.log(__dirname);
global.rootRequire = function (name) {
	return require(process.cwd() + '/node_modules/' + name);
};

const fs = require('fs');
const Hapi = require('hapi'); //http://hapijs.com/api
//const inert = require('inert');
const rp = require('request-promise'); //https://www.npmjs.com/package/request-promise
const log = rootRequire('nodeLogger/nodeLogger.js'); //https://github.com/dp1140a/nodeLogger
const properties = require('properties'); //https://github.com/gagle/node-properties
const Q = require('q'); //https://github.com/kriskowal/q
const snappy = require('snappy'); //https://github.com/kesla/node-snappy
const _ = require('underscore'); //http://underscorejs.org/
const avro = require('node-avro-io'); //https://github.com/mdlavin/node-avro-io/tree/node-4.1-adoption
const streamifier = require('streamifier'); //https://github.com/gagle/node-streamifier

/***********************
    Server Setup
***********************/
var logLevel = 'INFO';
log.init({
	logLevel: logLevel
});

const propOpts = {
	path: true,
	namespaces: true,
	sections: true,
	variables: true,
	include: true
};

var config = {
	'server': {
		'host': 'localhost',
		'port': 9001
	}
};
log.info(log.getConfig());
properties.parse(__dirname + '/server.properties', propOpts, function (error, obj) {
	if (error) {
		log.error('Could not load properties. ' + __dirname + '/server.properties. Please check the server.properties');
		log.error(error);
		log.error(obj);
		//process.exit(1);
	}
	config = obj;
	if (typeof obj.loglevel !== undefined && obj.logLevel !== logLevel) {
		log.warn('Setting loglevel to "' + obj.logLevel + '"');
		logLevel = obj.logLevel;
		log.init({
			logLevel: logLevel
		});
	}
	log.info('Log Level set to ' + log.getLogLevel());
	log.debug('Current Config: ' + JSON.stringify(config));
});

const server = new Hapi.Server();
//server.register(inert, function (err) {});
server.connection({
	host: config.server.host,
	address: config.server.host,
	port: config.server.port
});

log.info('Server Info: ' + JSON.stringify(server.info));
log.info('Current Dir Name: ' + __dirname);
log.info('Current Process Working Directory: ' + process.cwd());

/***********************
	    Routes
***********************/
/*
 *   Static Route
 */
server.route({
	method: 'GET',
	path: '/{param*}',
	handler: {
		directory: {
			path: process.cwd() + '/app',
			index: true
		}
	}
});

server.route({
	method: 'GET',
	path: '/fail',
	handler: function (request, reply) {
		try {
			throw {
				name: 'Fail Error',
				message: 'I have failed'
			};
		} catch (err) {
			log.error(err.message);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		}
	}
});

server.route({
	method: 'GET',
	path: '/noop',
	handler: function (request, reply) {
		return reply(null).type('application/json');
	}
})

server.route({
	method: 'GET',
	path: '/setup',
	handler: function (request, reply) {
		return reply(config.hadoop).type('application/json');
	}
});

server.route({
	method: 'POST',
	path: '/setup',
	handler: function (request, reply) {
		log.debug("Incoming Settings: " + JSON.stringify(request.payload));
		config.hadoop = request.payload; //Need to iterate and change only whats needed
		log.info("New Settings: " + JSON.stringify(config));
		return reply({
			'statusCode': 201,
			'message': 'SAVED'
		}).code(201).type('application/json');
	}
});

server.route({
	method: 'GET',
	path: '/hive/database',
	handler: function (request, reply) {
		var server = request.query.hive.webhcat.host;
		var username = request.query.user.name;
		var port = request.query.hive.webhcat.port;
		var url = 'http://' + server + ':' + port + '/templeton/v1/ddl/database?user.name=' + username;
		log.debug(url);
		rp(url).then(function (data) {
			log.debug(data);
			return reply(data).type('application/json');
		}).catch(function (err) {
			log.error(err);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		});
	}
});

server.route({
	method: 'GET',
	path: '/hive/database/tables',
	handler: function (request, reply) {
		var server = request.query.hive.webhcat.host;
		var username = request.query.user.name;
		var port = request.query.hive.webhcat.port;
		var db = request.query.hiveDB;
		var url = 'http://' + server + ':' + port + '/templeton/v1/ddl/database/' + db + '/table?user.name=' + username;
		log.debug(url);
		rp(url).then(function (data) {
			log.debug(data);
			return reply(data).type('application/json');
		}).catch(function (err) {
			log.error(err);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		});
	}
});

server.route({
	method: 'GET',
	path: '/hive/database/{db}/table/{table}',
	handler: function (request, reply) {
		log.info(request.params);
		var server = request.query.hive.webhcat.host;
		var username = request.query.user.name;
		var port = request.query.hive.webhcat.port;
		var db = request.params.db;
		var tableName = request.params.table;
		var url = 'http://' + server + ':' + port + '/templeton/v1/ddl/database/' + db + '/table/' + tableName + '?user.name=' + username;
		log.debug(url);
		rp(url).then(function (data) {
			log.debug(data);
			return reply(data).type('application/json');
		}).catch(function (err) {
			log.error(err);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		});
	}
});

server.route({
	method: 'GET',
	path: '/hive/jobs',
	handler: function (request, reply) {
		log.debug(request.query.hive.webhcat.host);
		var server = request.query.hive.webhcat.host;
		var username = request.query.user.name;
		var port = request.query.hive.webhcat.port;
		var url = 'http://' + server + ':' + port + '/templeton/v1/jobs/?showall=true&user.name=' + username;
		log.debug(url);
		rp(url).then(function (data) {
			log.debug(data);
			return reply(data).type('application/json');
		}).catch(function (err) {
			log.error(err);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		});
	}
});

server.route({
	method: 'GET',
	path: '/hive/job/{jobID}',
	handler: function (request, reply) {
		var server = request.query.hive.webhcat.host;
		var username = request.query.user.name;
		var port = request.query.hive.webhcat.port;
		var url = 'http://' + server + ':' + port + '/templeton/v1/jobs/' + request.params.jobID + '?user.name=' + username;
		log.debug(url);
		rp(url).then(function (data) {
			log.debug(data);
			return reply(data).type('application/json');
		}).catch(function (err) {
			log.error(err);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		});
	}
});

server.route({
	method: 'GET',
	path: '/hdfs/dir',
	handler: function (request, reply) {
		log.debug(request.query);
		log.info(config);
		var server = request.query.server;
		var path = request.query.path;
		log.debug(path);
		var url = 'http://' + server + path + '?user.name=' + config.hadoop.user.name + '&op=LISTSTATUS';
		log.debug(url);
		rp(url).then(function (data) {
			//console.log(data);
			return reply(data).type('application/json');
		}).catch(function (err) {
			log.error(err);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		});
	}
});

server.route({
	method: 'GET',
	path: '/hdfs/metadata/query',
	handler: function(request, reply){
		log.debug(request.query);
		var url = 'http://' + request.query.server + '?q=' + request.query.q;
		log.info(url);
		rp(url).then(function (data) {
			//console.log(data);
			return reply(data).type('application/json');
		}).catch(function (err) {
			log.error(err);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		});
	}
});

server.route({
	method: 'GET',
	path: '/hdfs/file/metadata',
	handler: function (request, reply) {
		var server = request.query.server;
		var path = request.query.path;
		var url = 'http://' + server + path + '?user.name=' + config.hadoop.user.name + '&op=';
		var ops = ['LISTSTATUS', 'GETFILECHECKSUM', 'GETXATTRS'];
		var metadata = {
			FileStatus: {},
			FileChecksum: {},
			XAttrs: {}
		};
		Q.all([getMetaDataAsync(url + ops[0]), getMetaDataAsync(url + ops[1]), getMetaDataAsync(url + ops[2])]).catch(function (err) {
			log.error(err);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		}).done(function (values) {
			metadata.FileStatus = JSON.parse(values[0]).FileStatuses.FileStatus;
			metadata.FileChecksum = JSON.parse(values[1]).FileChecksum;
			metadata.XAttrs = JSON.parse(values[2]).XAttrs;
			log.debug(metadata);
			return reply(metadata).type('application/json');
		});
	}
});

server.route({
	method: 'GET',
	path: '/hdfs/file/contents',
	handler: function (request, reply) {
		var server = request.query.server;
		var path = request.query.path;
		var offset = 0;
		var chunkSize = config.hadoop.hdfs.files.downloadBuffer;
		if (request.query.offset) {
			offset = request.query.offset;
		}
		var fileExtension = path.substr((~-path.lastIndexOf(".") >>> 0) + 2);
		var url = 'http://' + server + path + '?user.name=' + config.hadoop.user.name + '&op=OPEN&offset=' + offset + '&length=' + chunkSize;
		var fileData = {type: ''};
		var requestString = {
			method: 'GET',
			url: url,
			encoding: null
		};
		rp(requestString).then(function (data) {
			var hex = [];
			for (var i = 0; i < data.length; ++i) {
				hex.push(byteToHex(data[i]));
			}
			//Detect File Type
			if (detectAvro(hex)) {
				fileData.type = 'avro';
				var avroData = {
					'data': []
				};
				streamifier.createReadStream(data).pipe(new avro.DataFile.Reader(null)).on('header', function (data) {
					//log.debug(data.meta);
					avroData['meta'] = data.meta;
				}).on('data', function (data) {
					//log.debug(data);
					avroData.data.push(data);
				}).on('end', function (data) {
					//log.debug(avroData);
					fileData['data'] = avroData;
					return reply(fileData).type('text/json');
				});
			} else if (detectParquet(hex)) {
				fileData.type = 'parquet';
				fileData['data'] = readParquet(data).toString();
			} else if (detectOrc(hex)) {
				fileData.type = 'orc';
				fileData['data'] = readOrc(data).toString();
			} else {
				fileData.type = 'simple';
				fileData['data'] = data.toString();
				log.debug('Simple: true');
				return reply(fileData).type('text/json');
			}
			//log.debug(fileExtension);
			//return reply(data).type('application/octet-stream').charset('iso-8859-15');
		}).catch(function (err, x) {
			log.error(err);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		});
	}
});

server.route({
	method: 'GET',
	path: '/hdfs/file/test',
	handler: function (request, reply) {
		var url = 'http://192.168.104.149:50070/webhdfs/v1/user/hdfs/files/users.avro?user.name=' + config.hadoop.user.name + '&op=OPEN';
		var requestString = {
			method: 'GET',
			url: url,
			encoding: null
		};
		var avroData = {
			'data': []
		};
		rp(requestString).then(function (data) {
			streamifier.createReadStream(data).pipe(new avro.DataFile.Reader(null)).on('header', function (data) {
				//log.debug(data.meta);
				avroData['meta'] = data.meta;
			}).on('data', function (data) {
				//log.debug(data);
				avroData.data.push(data);
			}).on('end', function (data) {
				return reply(avroData);
			});
		}).catch(function (err, x) {
			log.error(err);
			return reply({
				'statusCode': 500,
				'error': err
			}).code(500).type('application/json');
		});
	}
});

var getMetaDataAsync = function (url) {
	return rp(url).promise();
};

var detectCodec = function (fileName, block) {
	var codecType = NONE;
	if (fileName.endsWith('.gz') && detectGzip(block)) {
		codecType = GZIP;
	} else if (fileName.endsWith('.snappy') && detect_snappy(block)) {
		codecType = SNAPPY;
	}
	return codecType;
};

var detectGzip = function (magic) {
	log.debug('GZIP (' + magic.slice(0, 3) + '):' + _.isEqual(magic.slice(0, 2), ['1F', '8B']));
	return _.isEqual(magic.slice(0, 2), ['1F', '8B']);
};

/**
 *	In order to do this we need the whole file
 **/
var detectSnappy = function (magic) {
	return false;
};

var detectAvro = function (magic) {
	log.debug('Avro (' + magic.slice(0, 3) + '):' + _.isEqual(magic.slice(0, 3), ['4F', '62', '6A']));
	return _.isEqual(magic.slice(0, 3), ['4F', '62', '6A']);
}

var detectParquet = function (magic) {
	log.debug('Parquet (' + magic.slice(0, 3) + '):' + _.isEqual(magic.slice(0, 4), ['50', '41', '52', '31']));
	return _.isEqual(magic.slice(0, 4), ['50', '41', '52', '31']);
}

var detectOrc = function (magic) {
	log.debug('ORC (' + magic.slice(0, 3) + '):' + _.isEqual(magic.slice(0, 3), ['4F', '52', '43']));
	return _.isEqual(magic.slice(0, 3), ['4F', '52', '43']);
}

var readGzip = function (data) {
	return data;
};

var readAvro = function (data) {
	var avroData = {
		'data': []
	};
	streamifier.createReadStream(data).pipe(new avro.DataFile.Reader(null)).on('header', function (data) {
		//log.debug(data.meta);
		avroData['meta'] = data.meta;
	}).on('data', function (data) {
		//log.debug(data);
		avroData.data.push(data);
	}).on('end', function (data) {
		//log.debug(avroData);
		return avroData;
	});
};
var readParquet = function (data) {
	return data;
};
var readOrc = function (data) {
	return data;
};
var readSnappy = function (data) {
	return data;
};

var readSimple = function (data) {
	return data;
};

function byteToHex(b) {
	var hexChar = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
	return hexChar[(b >> 4) & 0x0f] + hexChar[b & 0x0f];
};

if (typeof String.prototype.endsWith !== 'function') {
	String.prototype.endsWith = function (suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}
/**
fs.readFile(__dirname + '/words100K.txt.snappy', function (err, data) {
    log.debug(typeof data)
	snappy.isValidCompressed(data, function (e, result) {
		if (e) {
			console.log("error!", e);
			throw e;
		}
		log.debug("snappy.isValidCompressed: " + result);
	});
});
**/

/***********************
    Server Start
***********************/
server.start(function (err) {
	if (err) {
		log.error(err);
	}
	log.info('Server running at ' + server.info.uri);
});
module.exports = server;
