# Socket-STARTER FOR APPS

[![npm version](https://badge.fury.io/js/socket-starter.svg)](https://badge.fury.io/js/socket-starter) [![dependencies Status](https://david-dm.org/Prozi/socket-starter/status.svg)](https://david-dm.org/Prozi/socket-starter) [![Known Vulnerabilities](https://snyk.io/test/github/Prozi/socket-starter/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Prozi/socket-starter?targetFile=package.json) [![Maintainability](https://api.codeclimate.com/v1/badges/cf7828e55f51edffbe3d/maintainability)](https://codeclimate.com/github/Prozi/socket-starter/maintainability)

### socket.io 2 + express 4 + nodejs cluster + mongodb sticky-session

`yarn add socket-starter --save`

## APP EXAMPLE:

to run below example you can:

```bash
$ cd node_modules/socket-starter
$ yarn test
```

----

`index.js // of _your_ example chat minimum setup`
```javascript
const os = require('os')
const socketStarter = require('socket-starter')
const chat = require('./chat.js')

socketStarter({
  config: {
    totalWorkers: os.cpus().length,
    port: 3000,
    static: {
      directories: ['example/static']
    }
  },
  plugins: {
    chat
  }
})
```

see [example/index.js](https://github.com/Prozi/socket-starter/blob/master/example/index.js)

----

`chat.js`
```javascript
const sillyname = require('sillyname')

// it eats this format
const plugin = {
  initialize(io) {
    this.io = io
  },
  handshake(socket, data) {
    socket.name = sillyname.randomAdjective()
    socket.on('sent', (data) => {
      this.io.emit('sent', { name: socket.name, data })
      console.log(`🐼 ${socket.name}: ${data}`)
    })
    this.io.emit('joined', { name: socket.name })
    console.log(`🐼 ${socket.name} joined`, data)
  }
}

module.exports = plugin
module.exports.default = plugin
```

see [example/chat.js](https://github.com/Prozi/socket-starter/blob/master/example/chat.js)

----

`config.json // defaults to this configuration`
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

`index.html`

see [example/static/index.html](https://github.com/Prozi/socket-starter/blob/master/example/example/static/index.html)

----

### modules (for example chat) are in format:

```javascript
{ 
    initialize(io), 
    handshake(socket, data)
}
```

### the `const run = require('socket-starter')`

it returns a function, that takes one parameter: `options`

### options

```javascript
{
    config: {}, // example see example/config.json
    plugins: {} // example see example/chat.js
}
```

### config

this is the app's configuration, see that falls back if not supplied with `socket-starter/config.json`

* Config can also have optional express app instance as `config.app = express()`
* Config can also have optional server instance as `config.server` or it will listen on `config.server = config.app.listen()`

### plugins

Core concept:

the whole idea is that you can start few 'plugins' that are socket.io apps on single port
this is thanks to handshake function that joins a specific room for that socket, 
and that app 'plugin' has it's IO instance bound to this room. see source, you'll see what I mean.

the config is a json for express, mongodb, public static directories, etc.

### defaults

```
javasript
  if (!config.app) config.app = require('./app')(config)
  if (!config.server) config.server = config.app.listen()
```

see [source/app.js](https://github.com/Prozi/socket-starter/blob/master/source/app.js)

So you might supply your own app (express) / server instance
or not listen on it immediately...

### afterword

have fun, please open any issues, etc.

- Jacek Pietal

LICENSE: MIT do what you want, fork, etc.

