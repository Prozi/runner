const io = require('socket.io')
const createApp = require('./app')
const logo = require('./name')

async function addExpress(config) {
  if (!config.app) config.app = await createApp(config)
  if (!config.server) config.server = config.app.listen()
}

// Creates Socket IO instance on express app, with socket-starter plugins
async function start (config, plugins = {}) {
  
  await addExpress(config)
  
  // Note we don't use a port here because the master listens on it for us.
  // Don't expose our internal server to the outside.
  const $io = io(config.server)

  $io.set('origins', config.socket.origins)

  Object.keys(plugins).forEach((name) => {
    plugins[name].initialize($io.in(name))
    console.log(`${logo} initialized plugin: ${name}`)
  })

  $io.on('connect', (socket) => {
    // require custom handshake
    Object.keys(plugins).forEach((name) => {
      socket.on(`handshake:${name}`, (data) => {
        socket.join(name)
        plugins[name].handshake(socket, data)
      })
    })
  })

  // Listen to messages sent = from the master. Ignore everything else.
  process.on('message', (message, connection) => {
    if (message === config.socket.connectionMessage) {
      // Emulate a connection event on the server by emitting the
      // event with the connection the master sent us.
      config.server.emit('connection', connection)

      connection.resume()
    }
  })

  return config.server
}

module.exports = start
