# STARTER FOR APPS

### socket.io 2 + express 4 + nodejs cluster + passport mongodb auth

`npm install socket-starter --save`

## APP EXAMPLE:

to run below example you can:

```bash
cd node_modules/socket-starter
npm run test
```

----

index.html
```html
<!doctype html>
<html>
  <head>
    <title>Socket.IO Simplest Front End Example For Demonstration of Runner.js</title>
  </head>
  <body>
    <ul id="messages"></ul>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.1/socket.io.js"></script>
    <script>
      (function () {
        var APP_NAME = 'chat';
        var socket = io();
        var messages = document.getElementById('messages');
        function addMessage (message) {
          messages.innerHTML += '<li>' + message + '</li>';
        }
        socket.on('handshaken:' + APP_NAME, function (data) {
          addMessage('handshaken:' + JSON.stringify(data, null, 2));
        });
        socket.on('joined', function (data) {
          addMessage('joined:' + JSON.stringify(data, null, 2));
        });
        socket.emit('handshake:' + APP_NAME, { example: 'data for server' });
      })();
    </script>
  </body>
</html>
```

chat.js
```javascript
'use strict';

// it eats this format
module.exports = {
    initialize(io) {
        this.io = io;
        console.log('Initialized socket io');
    },
    handshake(socket, data) {
        console.log('Handshaken socket', socket.id, data);
        socket.emit('handshaken:example', {
            example: 'data from server'
        });
        this.io.emit('joined', socket.id);
    }
};
```

index.js
```javascript
'use strict';

const run = require('socket-starter');
const config = require('./config');
const chat = require('./chat');
const plugins = {
    chat
};

run({
    config,
    plugins
});
```

config.json
```javascript
{
    "auth": {
        "key": "express.sid",
        "secret": "this is a secret!",
        "cookie": {}
    },
    "colors": {
        "stamp": "yellow",
        "label": "white",
        "metadata": "green"
    },
    "store": {
        "url": "mongodb://localhost:27017/test",
        "collection": "mySessions"
    },
    "static": {
        "config": {
            "redirect": false,
            "maxAge": 86400000
        },
        "directories": ["public"]
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

### the `const run = require('socket-starter');`

it returns a function, that takes one parameter: `options`

### options

```javascript
{
    config,  // example see example/config.json
    plugins, // example see example/chat.js
    extend = (app) => {}
}
```

### config

this is the app's configuration, see that it has filled all fields from example/config.json

### plugins

Core concept:

the whole idea is that you can start few 'plugins' that are socket.io apps on single port
this is thanks to handshake function that joins a specific room for that socket, 
and that app 'plugin' has it's IO instance bound to this room. see source, you'll see what I mean.

the config is a json for express, mongodb, public static directories, etc.

### extend

the extend function is what you need to extend `express()` with

example:
```javascript
const routes = require('./routes');

run({
    config,
    plugins,
    extend
});

function extend (app) {
    app.use('/', routes);
}
```

have fun, please open any issues, etc.

- Jacek Pietal

LICENSE: MIT do what you want, fork, etc.

