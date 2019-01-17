const sillyname = require('sillyname')

// it eats this format
const plugin = {
  initialize(io) {
    this.io = io
    console.log('Initialized socket.io')
    console.log('Open http://localhost:3000/ to connect')
  },
  handshake(socket, data) {
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
