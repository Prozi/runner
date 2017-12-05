'use strict';

module.exports = function run(_ref) {
  var _ref$config = _ref.config,
      config = _ref$config === undefined ? {} : _ref$config,
      _ref$plugins = _ref.plugins,
      plugins = _ref$plugins === undefined ? {} : _ref$plugins,
      _ref$extend = _ref.extend,
      extend = _ref$extend === undefined ? null : _ref$extend;


  var passportSocketIo = require('passport.socketio');
  var express = require('express');
  var expressSession = require('express-session');
  var bodyParser = require('body-parser');
  var cookieParser = require('cookie-parser');
  var path = require('path');
  var http = require('http');
  var cors = require('cors');
  var compression = require('compression');
  var socketio = require('socket.io');
  var passport = require('passport');
  var MongoStore = require('connect-mongo')(expressSession);
  var sticky = require('sticky-session');
  var stamp = require('console-stamp');

  var app = express();
  var port = process.env.PORT || 3000;
  var store = new MongoStore(config.store);
  var cookie = cookieParser(config.auth.secret);
  var session = expressSession({
    key: config.auth.key || 'express.sid',
    secret: config.auth.secret,
    cookie: config.auth.cookie,
    resave: true,
    saveUninitialized: true,
    store: store
  });

  stamp(console, {
    metadata: config.metadata ? metadata : null,
    colors: config.colors || {}
  });

  // cors
  app.use(cors());

  // server static public dir
  app.set('view engine', 'html');
  config.static.directories.forEach(function (directory) {
    app.use(express.static(path.resolve(directory), config.static.config));
  });

  app.use(session);
  app.use(cookie);

  // for passport
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(compression());

  // optional extend app
  if (extend) {
    extend(app);
  }

  passport.serializeUser(serializeUser);
  passport.deserializeUser(serializeUser);

  var server = http.Server(app);
  var io = socketio.listen(server);

  io.set('origins', '*:*');

  // socket-passport integration
  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser.bind(null, config.auth.secret),
    key: config.auth.key,
    secret: config.auth.secret,
    store: store
  }));

  Object.keys(plugins).forEach(function (name) {
    plugins[name].initialize(io.in(name));
  });

  io.on('connect', function (socket) {
    console.info('[socket] connect', socket.id);
    // require custom handshake
    Object.keys(plugins).forEach(function (name) {
      socket.on('handshake:' + name, function (data) {
        socket.join(name);
        plugins[name].handshake(socket, data);
      });
    });
  });

  function metadata() {
    return '[' + process.memoryUsage().rss + ']';
  }

  function serializeUser(user, done) {
    done(null, user);
  }

  return sticky.listen(server, port, { workers: config.workers });
};