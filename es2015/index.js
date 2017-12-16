'use strict';

var express = require('express');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var http = require('http');
var cors = require('cors');
var compression = require('compression');
var socketio = require('socket.io');
var MongoStore = require('connect-mongo')(expressSession);
var sticky = require('sticky-cluster');
var stamp = require('console-stamp');
var port = process.env.PORT || 3000;

module.exports = function (params) {
  return sticky(function (callback) {
    callback(run(params));
  }, {
    concurrency: params.config.workers || 1,
    port: port,
    debug: true,
    env: function env(index) {
      return { stickycluster_worker_index: index };
    }
  });
};

function run(_ref) {
  var _ref$config = _ref.config,
      config = _ref$config === undefined ? {} : _ref$config,
      _ref$plugins = _ref.plugins,
      plugins = _ref$plugins === undefined ? {} : _ref$plugins,
      _ref$extend = _ref.extend,
      extend = _ref$extend === undefined ? null : _ref$extend;


  var app = express();
  var cookie = cookieParser(config.auth.secret);
  var store = new MongoStore(config.store);

  var sessionParams = getSessionParams(store, config);
  var session = expressSession(sessionParams);

  var stampParams = getStampParams(config);
  stamp(console, stampParams);

  app.use(cors());
  app.use(compression());

  app.use(session);
  app.use(cookie);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  serveStatic(app, config);

  // optional extend app
  if (extend) {
    extend(app);
  }

  var server = http.Server(app);
  var io = socketio.listen(server);

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

  return server;
}

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

function serveStatic(app, config) {
  // server static public dir
  app.set('view engine', 'html');
  config.static.directories.forEach(function (directory) {
    app.use(express.static(path.resolve(directory), config.static.config));
  });
}

function defaultMetadata() {
  return '[' + process.memoryUsage().rss + ']';
}