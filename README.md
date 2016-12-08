This is a lazy connector for multiple apps on same socket port

```bash
npm install yarn -g

vi server/config.json

yarn install

yarn start
```

add into server.js

modules in format

{ initialize(io), handshake(socket, data) }
