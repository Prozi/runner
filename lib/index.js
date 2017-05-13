'use strict';

function run({ config, plugins, extend }) {

    const express = require('express');
    const session = require('express-session');
    const bodyParser = require('body-parser');
    const cookieParser = require('cookie-parser');
    const path = require('path');
    const http = require('http');
    const compression = require('compression');
    const socketio = require('socket.io');
    const passport = require('passport');
    const passportIo = require('passport.socketio');
    const MongoStore = require('connect-mongo')(session);
    const cluster = require('sticky-cluster');
    const stamp = require('console-stamp');
    const mongoose = require('mongoose');

    mongoose.connect(config.store.url);

    const app = express();
    const port = process.env.PORT || 3000;
    const store = new MongoStore(config.store);

    const STICKY_OPTIONS = {
        port,
        env,
        concurrency: 1
    };

    stamp(console, {
        metadata,
        colors: config.colors
    });

    // server static public dir
    app.set('view engine', 'html');
    app.use(express.static(path.resolve(config.public), {
        redirect: false,
        maxAge: 86400000,
    }));

    app.use(cookieParser(config.auth.secret));

    // for passport
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    app.use(session(Object.assign(config.auth, {
        store,
        saveUninitialized: true,
        resave: true
    })));

    app.use(passport.initialize());
    app.use(passport.session());

    // compression
    app.use(compression());

    // cors, rest
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
        next();
    });

    // optional extend app
    if (extend) {
        extend(app);
    }

    const server = http.Server(app);
    const io = socketio.listen(server);

    passport.serializeUser(serializeUser);
    passport.deserializeUser(serializeUser);

    // socket-passport integration
    io.use(passportIo.authorize(Object.assign(config.auth, {
        passport,
        cookieParser,
        fail
    })));

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

    function sticky(server) {
        return cluster((callback) => callback(server), STICKY_OPTIONS);
    }

    function fail(data, message, error, accept) {
        // error indicates whether the fail is due to an error or just a unauthorized client
        if (error) {
            throw new Error(message);
        } else {
            console.error(message);
            accept(null, false);
        }
    }

    function env(index) {
        return {
            stickycluster_worker_index: index
        }
    }

    function metadata() {
        return '[' + process.memoryUsage().rss + ']';
    }

    function serializeUser(user, done) {
        done(null, user);
    };

    return sticky(server);

}

if (typeof module !== 'undefined') {
    module.exports = run;
}
