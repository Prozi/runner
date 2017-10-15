'use strict';

module.exports = function run({
  config = {},
  plugins = {},
  extend = null
}) {

  const passportSocketIo = require('passport.socketio');
  const express = require('express');
  const expressSession = require('express-session');
  const bodyParser = require('body-parser');
  const cookieParser = require('cookie-parser');
  const path = require('path');
  const http = require('http');
  const cors = require('cors');
  const compression = require('compression');
  const socketio = require('socket.io');
  const passport = require('passport');
  const MongoStore = require('connect-mongo')(expressSession);
  const sticky = require('sticky-session');
  const stamp = require('console-stamp');

  const app = express();
  const port = process.env.PORT || 3000;
  const store = new MongoStore(config.store);
  const cookie = cookieParser(config.auth.secret);
  const session = expressSession({
    key: config.auth.key || 'express.sid',
    secret: config.auth.secret,
    cookie: config.auth.cookie,
    resave: true,
    saveUninitialized: true,
    store
  });

  stamp(console, {
    metadata: config.metadata ? metadata : null,
    colors: config.colors || {}
  });

  // cors
  app.use(cors());

  // server static public dir
  app.set('view engine', 'html');
  config.static.directories.forEach((directory) => {
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

  const server = http.Server(app);
  const io = socketio.listen(server);

  io.set('origins', '*:*');

  // socket-passport integration
  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser.bind(null, config.auth.secret),
    key: config.auth.key,
    secret: config.auth.secret,
    store
  }));

  Object.keys(plugins).forEach((name) => {
    plugins[name].initialize(io.in(name));
  });

  io.on('connect', (socket) => {
    console.info('[socket] connect', socket.id);
    // require custom handshake
    Object.keys(plugins).forEach((name) => {
      socket.on(`handshake:${name}`, (data) => {
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
