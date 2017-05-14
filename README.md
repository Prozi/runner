# STARTER FOR APPS

### socket.io 2 + express 4 + nodejs cluster + passport mongodb auth

## APP TEMPLATE:

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

const run = require('../lib');
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


modules (for example chat) are in format:

{ initialize(io), handshake(socket, data) }
