const sillyname = require('sillyname')

// Socket Starter Format:
const plugin = {
  messages: [],
  initialize (io) {
    this.io = io
  },
  handshake (socket, handshake) {
    this.socket = socket
    this.socket.name = sillyname.randomAdjective()
    this.socket.on('sent', (data) => panda.call(this, 'sent', data, true))
    this.socket.on('disconnect', (data) => panda.call(this, 'left', data, true))
    this.socket.emit('messages', { messages: this.messages, handshake })
    panda.call(this, 'joined', handshake, true)
  }
}

function panda (action, data, push = false) {
  const name = this.socket.name
  this.io.emit(action, { name, data })
  if (push) {
    this.messages.push({ name, action, data })
    console.log(`🐼 ${name} ${action} ${JSON.stringify(data, null, 2)}`)
  }
}

module.exports = plugin
module.exports.default = plugin

/* MUCH WOW SO EASY */
