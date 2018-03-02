'use strict';

// Dependencies

var cluster = require('cluster');
var port = process.env.PORT || 3000;

// This stores our workers. We need to keep them to be able to reference
// them based on source IP address. It's also useful for auto-restart,
// for example.
var workers = [];

// Connection message - string constant
var CONNECTION_MESSAGE = 'sticky-session:connection';

// This is what will be exported
function main(_ref) {
  var _ref$config = _ref.config,
      config = _ref$config === undefined ? {} : _ref$config,
      _ref$plugins = _ref.plugins,
      plugins = _ref$plugins === undefined ? {} : _ref$plugins,
      _ref$extend = _ref.extend,
      extend = _ref$extend === undefined ? null : _ref$extend;

  if (cluster.isMaster) {

    /* eslint-disable no-inner-declarations */
    // Helper function for spawning worker at index 'i'.
    var spawnWorker = function spawnWorker(i) {
      workers[i] = cluster.fork();

      // Optional: Restart worker on exit
      workers[i].on('exit', function (code, signal) {
        console.warn('socket-starter: respawning worker ' + i);
        spawnWorker(i);
      });
    };

    // Helper function for getting a worker index based on IP address.
    // This is a hot path so it should be really fast. The way it works
    // is by converting the IP address to a number by removing non numeric
    // characters, then compressing it to the number of slots we have.
    //
    // Compared against "real" hashing (from the sticky-session code) and
    // "real" IP number conversion, this function is on par in terms of
    // worker index distribution only much faster.


    var getWorkerIndex = function getWorkerIndex(ip) {
      return farmhash.fingerprint32(ip) % totalWorkers; // Farmhash is the fastest and works with IPv6, too
    };

    // Lazy load dependencies
    var net = require('net');
    var farmhash = require('farmhash');

    // Get from config
    var totalWorkers = config.workers || 1;

    // Spawn workers.
    for (var i = 0; i < totalWorkers; i++) {
      spawnWorker(i);
    }

    // Create the outside facing server listening on our port.
    net.createServer({ pauseOnConnect: true }, function (connection) {
      // We received a connection and need to pass it to the appropriate
      // worker. Get the worker for this connection's source IP and pass
      // it the connection.
      var worker = workers[getWorkerIndex(connection.remoteAddress)];
      if (worker) {
        worker.send(CONNECTION_MESSAGE, connection);
      }
    }).listen(port);
  } else {
    var app = createApp(config);
    if (extend) {
      extend(app);
    }
    return createIO(app, plugins);
  }
}

// Creates express app, adds express plugins, extends app
function createApp(config) {
  // Lazy load dependencies
  var express = require('express');
  var cookieParser = require('cookie-parser');
  var expressSession = require('express-session');
  var MongoStore = require('connect-mongo')(expressSession);
  var stamp = require('console-stamp');
  var cors = require('cors');
  var compression = require('compression');
  var bodyParser = require('body-parser');
  var path = require('path');

  var app = express();
  var cookie = cookieParser(config.auth.secret);
  var store = new MongoStore(config.store);

  var sessionParams = getSessionParams(store, config);
  var session = expressSession(sessionParams);

  stamp(console, getStampParams(config));

  app.use(cors());
  app.use(compression());

  app.use(session);
  app.use(cookie);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.set('view engine', 'html');

  config.static.directories.forEach(function (directory) {
    app.use(express.static(path.resolve(directory), config.static.config));
  });

  return app;
}

// Creates Socket IO instance on express app, with socket-starter plugins
function createIO(app, plugins) {
  var socketio = require('socket.io');

  // Note we don't use a port here because the master listens on it for us.
  // Don't expose our internal server to the outside.
  var server = app.listen();
  var io = socketio(server);

  // Tell Socket.IO to use the redis adapter. By default, the redis
  // server is assumed to be on localhost:6379. You don't have to
  // specify them explicitly unless you want to change them.
  // io.adapter(sio_redis(redis_uri))

  // Allow connection from any origin
  io.set('origins', '*:*');

  Object.keys(plugins).forEach(function (name) {
    plugins[name].initialize(io.in(name));
  });

  io.on('connect', function (socket) {
    console.log('[socket] connect', socket.id);
    // require custom handshake
    Object.keys(plugins).forEach(function (name) {
      socket.on('handshake:' + name, function (data) {
        socket.join(name);
        plugins[name].handshake(socket, data);
      });
    });
  });

  // Listen to messages sent from the master. Ignore everything else.
  process.on('message', function (message, connection) {
    if (message === CONNECTION_MESSAGE) {
      // Emulate a connection event on the server by emitting the
      // event with the connection the master sent us.
      server.emit('connection', connection);

      connection.resume();
    }
  });

  return server;
}

// ----
// Helper functions for socket-starter

function getSessionParams(store, config) {
  return {
    key: config.auth.key || 'express.sid',
    secret: config.auth.secret,
    cookie: config.auth.cookie,
    resave: true,
    saveUninitialized: true,
    store: store
  };
}

function getStampParams(config) {
  var metadata = typeof config.metadata === 'function' ? config.metadata : config.metadata ? defaultMetadata : null;
  return {
    metadata: metadata,
    colors: config.colors || {}
  };
}

function defaultMetadata() {
  return '[' + process.memoryUsage().rss + ']';
}

// ----
// Exports

module.exports = main;

module.exports.default = module.exports;