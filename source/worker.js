const socketio = require('socket.io')

// Creates Socket IO instance on express app, with socket-starter plugins
function createIO (config, plugins) {
  if (!config.app) config.app = require('./app')(config)
  if (!config.server) config.server = config.app.listen()

  // Note we don't use a port here because the master listens on it for us.
  // Don't expose our internal server to the outside.
  const io = socketio(config.server)

  // Tell Socket.IO to use the redis adapter. By default, the redis
  // server is assumed to be on localhost:6379. You don't have to
  // specify them explicitly unless you want to change them.
  // io.adapter(sio_redis(redis_uri))

  // Allow connection = require(any origin
  io.set('origins', '*:*')

  Object.keys(plugins).forEach((name) => {
    plugins[name].initialize(io.in(name))
  })

  io.on('connect', (socket) => {
    console.log('[socket-starter] socket.io connect:', socket.id)
    // require custom handshake
    Object.keys(plugins).forEach((name) => {
      socket.on(`handshake:${name}`, (data) => {
        socket.join(name)
        plugins[name].handshake(socket, data)
      })
    })
  })

  // Listen to messages sent = require(the master. Ignore everything else.
  process.on('message', (message, connection) => {
    if (message === config.connectionMessage) {
      // Emulate a connection event on the server by emitting the
      // event with the connection the master sent us.
      config.server.emit('connection', connection)

      connection.resume()
    }
  })

  return config.server
}

module.exports = createIO
module.exports.default = createIO
