# STARTER FOR APPS

### socket.io 2 + express 4 + nodejs cluster + mongodb sticky-session

`yarn add socket-starter --save`

## APP EXAMPLE:

to run below example you can:

```bash
$ cd node_modules/socket-starter
$ yarn test
```

----

index.html
```html
<!doctype html>
<html>
  <head>
    <title>Socket.IO Simplest Front End Example For Demonstration of Socket-Starter</title>
    <style>
      body, input {
        font-size: 2rem;
        font-family: Verdana, Geneva, Tahoma, sans-serif;
      }
      code {
        white-space: pre-wrap;
      }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js"></script>
  </head>
  <body>
    <form id="chat">
      <h1>Chat</h1>
      <input type="text" id="message"/>
      <input type="submit" value="send"/>
      <div id="messages"></div>
    </form>
    <script>
      (function () {
        var socket = io('http://localhost:3000')
        socket.on('connect', function () {
          socket.emit('handshake:chat', { example: 'data for server' })
        })
        socket.on('joined', function (payload) {
          addMessage(payload.name, 'joined')
        })
        socket.on('sent', function (payload) {
          addMessage(payload.name, payload.data)
        })
        document.getElementById('chat').addEventListener('submit', function (event) {
          event.preventDefault()
          socket.emit('sent', document.getElementById('message').value)
        })
        function addMessage (type, message) {
          document.getElementById('messages').innerHTML += '<div><span>' + type + '</span> <code>' + message + '</code></div>\n'
        }
      })()
    </script>
  </body>
</html>
```

chat.js
```javascript
const sillyname = require('sillyname')

// it eats this format
const plugin = {
  initialize(io) {
    this.io = io
    console.log('Initialized socket.io')
    console.log('Open http://localhost:3000/ to connect')
  },
  handshake(socket, data) {
    console.log(data)
    socket.name = sillyname.randomAdjective()
    socket.emit('handshaken:chat', data)
    socket.on('sent', (data) => {
      this.io.emit('sent', { name: socket.name, data })
    })
    this.io.emit('joined', { name: socket.name })
  }
}

module.exports = plugin
module.exports.default = plugin
```

index.js // of example
```javascript
// in your project just use `require('socket-starter')({ ... })`
require('../source/index.js')({
  config: require('./config.json'),
  plugins: {
    chat: require('./chat.js')
  }
})
```

config.json // example configuration
```javascript
{
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

see [example folder](https://github.com/Prozi/socket-starter/tree/master/example)


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
    config, // example see example/config.json
    plugins // example see example/chat.js
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

So you might supply your own app (express) / server instance
or not listen on it immediately...

### afterword

have fun, please open any issues, etc.

- Jacek Pietal

LICENSE: MIT do what you want, fork, etc.

