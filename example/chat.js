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
