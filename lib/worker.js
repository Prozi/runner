const io = require('socket.io')
const logo = require('./name')
const createApp = require('./app')

// Creates Socket IO instance on express app, with socket-starter plugins
async function start (setup = {}, plugins = {}) {
  // Ensure we always have express instance at this point
  // either provided by user in setup or we create one
  await addExpress(setup)

  // Note we don't use a port here because the master listens on it for us.
  // Don't expose our internal server to the outside.
  const $io = io(setup.server)

  $io.set('origins', setup.socket.origins)

  Object.keys(plugins).forEach((name) => {
    plugins[name].initialize(
      $io.in(name)
    )
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
    if (message === setup.socket.connectionMessage) {
      // Emulate a connection event on the server by emitting the
      // event with the connection the master sent us.
      setup.server && setup.server.emit('connection', connection)

      connection.resume()
    }
  })

  return setup.server
}

// Helper function to ensure
// we have express() instance at this point we call it
async function addExpress (setup) {
  if (!setup.app) {
    setup.app = await createApp(setup)
  }
  if (!setup.server) {
    setup.server = setup.app.listen(
      setup.totalWorkers === 0 ? setup.port : null
    )
  }
}

module.exports = start
