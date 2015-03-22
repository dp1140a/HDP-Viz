/* jshint strict: false */
console.log(process.cwd());
console.log(__dirname);
global.rootRequire = function(name) {
    return require(process.cwd() + '/node_modules/' + name);
}

const Hapi = require('hapi'); //http://hapijs.com/api
const rp = require('request-promise'); //https://www.npmjs.com/package/request-promise
const log = rootRequire('nodeLogger/nodeLogger.js');
const properties = require('properties'); //https://github.com/gagle/node-properties
//const Q = require('q'); //https://github.com/kriskowal/q
//const _ = require('underscore'); //http://underscorejs.org/
//const async = require('async'); //https://github.com/caolan/async
//const fs = require('fs');

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
properties.parse(__dirname + '/server.properties', propOpts, function(error, obj) {
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
    path: '/setup',
    handler: function(request, reply) {
        return reply(config).type('application/json');
    }
});

server.route({
    method: 'POST',
    path: '/setup',
    handler: function(request, reply) {
        log.debug(request.payload);
        config = request.payload;
        return reply({
            'statusCode': 201,
            'message': 'SAVED'
        }).code(201).type('application/json');
    }
});

server.route({
    method: 'GET',
    path: '/hive/database',
    handler: function(request, reply) {
        var server = request.query['hive.webhcat.host'];
        var username = request.query['user.name'];
        var port = request.query['hive.webhcat.port'];
        var url = 'http://' + server + ':' + port + '/templeton/v1/ddl/database?user.name=' + username;
        log.debug(url);
        rp(url).then(function(data) {
            log.debug(data);
            return reply(data).type('application/json');
        }).catch(function(err) {
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
    handler: function(request, reply) {
        var server = request.query['hive.webhcat.host'];
        var username = request.query['user.name'];
        var port = request.query['hive.webhcat.port'];
        var db = request.query.hiveDB;
        var url = 'http://' + server + ':' + port + '/templeton/v1/ddl/database/' + db + '/table?user.name=' + username;
        log.debug(url);
        rp(url).then(function(data) {
            log.debug(data);
            return reply(data).type('application/json');
        }).catch(function(err) {
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
    handler: function(request, reply) {
        log.info(request.params);
        var server = request.query['hive.webhcat.host'];
        var username = request.query['user.name'];
        var port = request.query['hive.webhcat.port'];
        var db = request.params.db;
        var tableName = request.params.table;
        var url = 'http://' + server + ':' + port + '/templeton/v1/ddl/database/' + db + '/table/' + tableName + '?user.name=' + username;
        log.debug(url);
        rp(url).then(function(data) {
            log.debug(data);
            return reply(data).type('application/json');
        }).catch(function(err) {
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
    handler: function(request, reply) {
        log.debug(request.query);
        var server = request.query['hive.webhcat.host'];
        var username = request.query['user.name'];
        var port = request.query['hive.webhcat.port'];
        var url = 'http://' + server + ':' + port + '/templeton/v1/jobs/?showall=true&user.name=' + username;
        log.debug(url);
        rp(url).then(function(data) {
            log.debug(data);
            return reply(data).type('application/json');
        }).catch(function(err) {
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
    handler: function(request, reply) {
        var server = request.query['hive.webhcat.host'];
        var username = request.query['user.name'];
        var port = request.query['hive.webhcat.port'];
        var url = 'http://' + server + ':' + port + '/templeton/v1/jobs/' + request.params.jobID + '?user.name=' + username;
        log.debug(url);
        rp(url).then(function(data) {
            log.debug(data);
            return reply(data).type('application/json');
        }).catch(function(err) {
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
    path: '/hdfs',
    handler: function(request, reply) {
        var server = request.query.server;
        var path = request.query.path;
        log.debug(path);
        var url = 'http://' + server + path + '?op=LISTSTATUS';
        log.debug(url);
        rp(url).then(function(data) {
            //console.log(data);
            return reply(data).type('application/json');
        }).catch(function(err) {
            log.error(err);
            return reply({
                'statusCode': 500,
                'error': err
            }).code(500).type('application/json');
        });
    }
});

/***********************
    Server Start
***********************/
server.start(function() {
    log.info('Server running at ' + server.info.uri);
});
module.exports = server;
