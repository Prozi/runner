import runner, { RunnerFormat } from './runner';

// it eats this format
const example = new RunnerFormat({
  initialize(io) {
    this.io = io;
    console.log('Initialized socket io');
  },
  handshake(socket, data) {
    console.log('Handshaken socket', socket.id, data);
    socket.emit('handshaken:example', { example: 'data from server' });
    this.io.emit('joined', socket.id);
  }
});

// this is how you run it
runner({ example });
