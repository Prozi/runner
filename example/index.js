'use strict';

const config = require('./config');
const run = require('../lib');

// it eats this format
const example = {
    initialize(io) {
        this.io = io;
        console.log('Initialized socket io');
    },
    handshake(socket, data) {
        console.log('Handshaken socket', socket.id, data);
        socket.emit('handshaken:example', {
            example: 'data from server'
        });
        this.io.emit('joined', socket.id);
    }
};

const plugins = { example };

run({
    config,
    plugins
});