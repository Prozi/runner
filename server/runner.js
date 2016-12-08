'use strict';

import express from 'express';
import session from 'express-session';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import path from 'path';
import http from 'http';
import sillyname from 'sillyname';
import compression from 'compression';
import socketIo from 'socket.io';
import stamp from 'console-stamp';
import passport from 'passport';
import passportIo from 'passport.socketio';
import sticky from 'socketio-sticky-session';
import config from './config';

stamp(console, 'HH:MM:ss.l');

const port = process.env.PORT || 3000;
const MongoDBStore = require('connect-mongodb-session')(session);

// session storage - for passport
const basicAuthConfig = {
  key:    'express.sid',
  secret: 'Jacek Pietal',
  store:  new MongoDBStore(config.mongoDBStore)  
};

export default function runner(plugins = {}) {

	const app = express();

	// view engine
	app.engine('html', ejs.renderFile);
	app.set('view engine', 'html');
	app.set('views', path.join(__dirname, '..', 'dist'));

	// compression
	app.use(compression());

	// for passport
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(session(Object.assign(basicAuthConfig, {
	  saveUninitialized: false,
	  resave: false
	})));
	app.use(passport.initialize());
	app.use(passport.session());

	// cors, rest
	app.use((req, res, next) => {
	 res.header('Access-Control-Allow-Origin', '*');
	 res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	 res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
	 next();
	});

	// frontend cache
	app.use(express.static(path.join(__dirname, '..', 'dist'), { 
	  redirect: false, 
	  maxAge: 86400000, /* one day */
	}));

	// for passport
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());

	// fallback
	app.use((req, res) => {
	  res.render('index'); 
	});

	return createServer(app, plugins);

}

function createServer (app, plugins) {

  const server = http.createServer(app);
  const io = socketIo.listen(server);

  // socket-passport integration
  io.use(passportIo.authorize(Object.assign(basicAuthConfig, {
    cookieParser: cookieParser,
    fail: onAuthorizeFail
  })));

  // initialize modules for socket io
  for (let name in plugins) {
    if (plugins.hasOwnProperty(name)) {
      plugins[name].initialize(io.in(`#${name}`));
    }
  }

  io.on('connect', (socket) => {
    console.log('[socket] connect', socket.id);
    // require custom handshake
    for (let name in plugins) {
      if (plugins.hasOwnProperty(name)) {
        socket.on(`handshake:${name}`, (data) => {
          socket.join(`#${name}`);
          plugins[name].handshake(socket, data);
        });
      }
    }
  });

  server.listen(port, function() {
    console.log(`Listening on port ${port}`);
  });

  return { io, server }; 
}

function onAuthorizeFail (data, message, error, accept) {
  // error indicates whether the fail is due to an error or just a unauthorized client
  if(error) {
    throw new Error(message);
  } else {
    console.log(message);
    accept(null, false);
  }
}

export function RunnerFormat ({ initialize, handshake }) {
  this.initialize = initialize.bind(this);
  this.handshake = handshake.bind(this);
};
