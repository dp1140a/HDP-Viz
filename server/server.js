/* jshint strict: false */
const Hapi = require('hapi'); //http://hapijs.com/api
const rp = require('request-promise'); //https://www.npmjs.com/package/request-promise
//const Q = require('q'); //https://github.com/kriskowal/q
//const _ = require('underscore'); //http://underscorejs.org/
//const async = require('async'); //https://github.com/caolan/async
const log = require('nodeLogger');
//const fs = require('fs');
const properties = require('properties'); //https://github.com/gagle/node-properties
/***********************
    Server Setup
***********************/
log.init({
    logLevel: 'DEBUG'
});

const propOpts = {
    path: true,
    namespaces: true,
    sections: true,
    variables: true,
    include: true
};

var props = {
    'server': {
        'port': 9001
    }
};

properties.parse(__dirname + '/server.properties', propOpts, function(error, obj) {
    if (error) {
        log.error('Could not load properties. ' + __dirname + '/server.properties. Please check the server.properties');
        log.error(error);
        log.error(obj);
        //process.exit(1);
    }
    props = obj;
    log.debug(props);
});

var PORT = props.server.port;
if (process.argv[2] !== undefined) {
    log.warn('Setting PORT to ' + process.argv[2]);
    PORT = process.argv[2];
}

log.info(PORT);
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    address: 'localhost',
    port: PORT
});

log.info(server.info);
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
        return reply(props).type('application/json');
    }
});

server.route({
    method: 'POST',
    path: '/setup',
    handler: function(request, reply) {
        log.debug(request.payload);
        props = request.payload;
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
    log.info('Server running at:', server.info.uri);
});
module.exports = server;
