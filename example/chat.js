'use strict';

// it eats this format
module.exports = {
  initialize(io) {
    this.io = io;
    console.log('Initialized socket io');
  },
  handshake(socket, data) {
    console.log('Handshaken socket', socket.id, data);
    socket.emit('handshaken:chat', {
      example: 'data from server'
    });
    this.io.emit('joined', socket.id);
  }
};