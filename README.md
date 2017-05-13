This is a lazy connector for multiple apps on same socket port

```bash
'use strict';

const run = require('socket-starter');
const config = require('./config.json');
const chat = require('./chat');
const plugins = {
	chat
};

run({
    config,
    plugins,
    extend
});

function extend (app) {
    app.use('/', require('./routes'));
}
```

see example/index.js for more details

modules (for example chat) are in format:

{ initialize(io), handshake(socket, data) }
