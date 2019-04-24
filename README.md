# Socket Starter

[![npm version](https://badge.fury.io/js/socket-starter.svg)](https://badge.fury.io/js/socket-starter) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/Prozi/socket-starter/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/Prozi/socket-starter/?branch=master) [![Known Vulnerabilities](https://snyk.io/test/github/Prozi/socket-starter/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Prozi/socket-starter?targetFile=package.json) [![Maintainability](https://api.codeclimate.com/v1/badges/cf7828e55f51edffbe3d/maintainability)](https://codeclimate.com/github/Prozi/socket-starter/maintainability)

### socket.io 2 + express 4 + nodejs cluster + mongodb sticky-session

`yarn add socket-starter --save`

### the `require('socket-starter')`

returns a `function` you can `call` anytime

that takes in as only `argument` an `object` consisting of two fields:

```javascript
{
  config: { /* see example/config.json */ },
  plugins: {
    initialize (io) => {},
    handshake(socket, data) => {}
  }
}
```

and returns a `express server instance`

## Application (Chat) Example:

To run below example you can:

```bash
$ cd node_modules/socket-starter
$ yarn test
```

----

`index.js` of example chat _minimum_ setup
```javascript
const socketStarter = require('socket-starter')
const chat = require('socket-starter/source/chat')

socketStarter({ plugins: { chat } })
```

See similar: [example/index.js](https://github.com/Prozi/socket-starter/blob/master/example/index.js)

----

This is how to create a vanilla simple chat with this socket starter
it is already included @ [socket-starter/source/chat](https://github.com/Prozi/socket-starter/blob/master/example/chat.js)


```javascript
const sillyname = require('sillyname')

// Socket Starter Format:
const plugin = {
  messages: [],
  initialize (io) {
    this.io = io
  },
  handshake (socket, handshake) {
    this.socket = socket
    this.socket.name = sillyname.randomAdjective()
    this.socket.on('sent', (data) => panda.call(this, 'sent', data, true))
    this.socket.on('disconnect', (data) => panda.call(this, 'left', data, true))
    this.socket.emit('messages', { messages: this.messages, handshake })
    panda.call(this, 'joined', handshake, true)
  }
}

function panda (action, data, push = false) {
  const name = this.socket.name
  this.io.emit(action, { name, data })
  if (push) {
    this.messages.push({ name, action, data })
    console.log(`🐼 ${name} ${action} ${JSON.stringify(data, null, 2)}`)
  }
}

module.exports = plugin
module.exports.default = plugin

/* MUCH WOW SO EASY */
```

----

`config.json` defaults to this configuration:

```javascript
{
  "port" process.env.PORT,
  "totalWorkers": 1,
  "sessionParams": {
    "key": "prozi85",
    "secret": "socket-starter",
    "resave": true,
    "saveUninitialized": true
  },
  "connectionMessage": "sticky-session:connection",
  "mongoStore": {
    "url": "mongodb://localhost:27017/",
    "collection": "sessions"
  },
  "static": {
    "directories": ["static"]
  }
}

```

see [config.json](https://github.com/Prozi/socket-starter/blob/master/config.json)

----

To see complimentary RAW frontend of above chat (`index.html` - working)

see [example/static/index.html](https://github.com/Prozi/socket-starter/blob/master/example/example/static/index.html)

----

### config

this is the app's configuration, see that falls back if not supplied with `socket-starter/config.json`

* Config can also have optional express app instance as `config.app = express()`
* Config can also have optional server instance as `config.server` or it will listen on `config.server = config.app.listen()`

Also Check out `socket-starter/source/app` for more information about app instance...

### plugins

Core concept:

the whole idea is that you can start few 'plugins' that are socket.io apps on single port
this is thanks to handshake function that joins a specific room for that socket, 
and that app 'plugin' has it's IO instance bound to this room. see source, you'll see what I mean.

the config is a json for express, mongodb, public static directories, etc.

### defaults

```javascript
  const app = require('socket-starter/source/app')
  if (!config.app) config.app = await app(config)
  if (!config.server) config.server = config.app.listen()
```

see [socket-starter/source/app](https://github.com/Prozi/socket-starter/blob/master/source/app.js)

So you might supply your own app (express) / server instance
or not listen on it immediately...

### afterword

have fun, please open any issues, etc.

- Jacek Pietal

LICENSE: MIT do what you want, fork, etc.
