# Socket-Starter

🚨 Deprecated in favor of [@jackepietal/bouncer.js](https://github.com/Prozi/bouncer.js).

🚨 For upgrade guide refer to [backwards-compatibility section of bouncer.js](https://github.com/Prozi/bouncer.js#backwards-compatibility)

---

Latest [optional] Clustered _Express with Socket.IO_ and [optional] MongoDB Sticky-Session

[![npm version](https://badge.fury.io/js/socket-starter.svg)](https://badge.fury.io/js/socket-starter) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/Prozi/socket-starter/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/Prozi/socket-starter/?branch=master) [![Known Vulnerabilities](https://snyk.io/test/github/Prozi/socket-starter/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Prozi/socket-starter?targetFile=package.json) [![Maintainability](https://api.codeclimate.com/v1/badges/cf7828e55f51edffbe3d/maintainability)](https://codeclimate.com/github/Prozi/socket-starter/maintainability)

## What's this?

If you're only able to spawn one process and you'd like to have an `express` app with `static content serving`,
and at the same time spawn X number of scalable microservices that use `node` and can connect `websockets` (socket.io for performance).

## Common use case

- Single process app server like a free `heroku.com` account or similar
- Build a chat
- Make a node + javascript games

## Installation

It's hosted as an `npm` package so installation is of course as simple as:

```bash
yarn add socket-starter --save
# you will also need socket.io-client for frontend
# socket.io is auto-included
```

## The application:

Node part you should do call the `socketStarter` (import socketStarter) function:

```javascript
const socketStarter = require('socket-starter')

const server = createServer()

async function createServer() {
  return await socketStarter({
    plugins: {
      microService1: {
        initialize (io) => {},
        handshake(socket, data) => {
          console.log('This should be foobar:', data)
          socket.emit('messageFromMicroService1', 'payload1')
        }
      },
      microService2: {
        initialize (io) => {},
        handshake(socket, data) => {
          socket.emit('messageFromMicroService2', 'payload2')
        }
      }
      // ... any number of plugins
    },
    // Customization information below
    // Otherwise put static content inside root `static` directory
  })
}
```

Frontend can use the above backend in this manner (javascript part):

```javascript
const io = require("socket.io-client");

const socket = io();

socket.on("connect", function () {
  ["messageFromMicroService1", "messageFromMicroService2"].forEach(
    (message) => {
      socket.on(message, (...args) => console.log(message, ...args));
    }
  );

  socket.emit("handshake:microService1", "foobar1");
  socket.emit("handshake:microService2");
});
```

## Full Application (Chat) Example:

To run below example you can:

```bash
$ cd node_modules/socket-starter
$ yarn test
```

---

`index.js` of example chat _minimum_ setup

```javascript
const start = require("socket-starter");
const chat = require("socket-starter/lib/chat");

start({ plugins: { chat } });
```

See similar: [example/index.js](https://github.com/Prozi/socket-starter/blob/master/example/index.js)

---

This is how to create a vanilla simple chat with this socket starter
it is already included @ [socket-starter/lib/chat](https://github.com/Prozi/socket-starter/blob/master/example/chat.js)

```javascript
const sillyname = require("sillyname");

// Socket Starter Format:
const plugin = {
  messages: [],
  initialize(io) {
    this.io = io;
  },
  handshake(socket, handshake) {
    this.socket = socket;
    this.socket.name = sillyname.randomAdjective();
    this.socket.on("sent", (data) => panda.call(this, "sent", data, true));
    this.socket.on("disconnect", (data) =>
      panda.call(this, "left", data, true)
    );
    this.socket.emit("messages", { messages: this.messages, handshake });
    panda.call(this, "joined", handshake, true);
  },
};

function panda(action, data, push = false) {
  const name = this.socket.name;
  this.io.emit(action, { name, data });
  if (push) {
    this.messages.push({ name, action, data });
    console.log(`🐼 ${name} ${action} ${JSON.stringify(data, null, 2)}`);
  }
}

module.exports = plugin;

/* MUCH WOW SO EASY */
```

---

You can provide the factory function with config key, which otherwise defaults to below configuration:

```javascript
const cluster = require("cluster");

module.exports = {
  isMaster: cluster.isMaster,
  port: process.env.PORT || 8080,
  totalWorkers: process.env.WEB_CONCURRENCY || 1,
  socket: {
    origins: "*:*",
    connectionMessage: "sticky-session:connection",
  },
  sessionParams: {
    key: "socket-starter",
    secret: "TheCakeIsALie",
    resave: true,
    saveUninitialized: true,
  },
  mongoStore: {
    url: process.env.MONGODB_URI || "mongodb://localhost:27017/",
    collection: "sessions",
  },
  static: {
    directories: ["static"],
  },
};
```

see [config.js](https://github.com/Prozi/socket-starter/blob/master/config.js)

---

To see complimentary RAW frontend of above chat (`index.html` - working)

see [example/static/index.html](https://github.com/Prozi/socket-starter/blob/master/example/static/index.html)

---

### Configuration/Customization

this is the app's configuration, see that falls back if not supplied with `socket-starter/config.js`

- Config can also have optional express app instance as `config.app = express()`
- Config can also have optional server instance as `config.server` or it will listen on `config.server = config.app.listen()`

Also Check out `socket-starter/lib/app` for more information about app instance...

### Advanced

You can further extend the `express` application by providing the `app` or `server` params.
If they are not provided, they default to below:

```javascript
const createApp = require("socket-starter/lib/app");

if (!config.app) config.app = await createApp(config);
if (!config.server) config.server = config.app.listen();
```

see [socket-starter/lib/app](https://github.com/Prozi/socket-starter/blob/master/lib/app.js)

So you might supply your own app (express) / server instance
or not listen on it immediately...

### License

MIT

- Do what you want, fork, etc.
- I am not responsible for any problem this free application causes :P

have fun, please open any issues, etc.

- Jacek Pietal
