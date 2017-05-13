'use strict';

const run = require('../lib');
const config = require('./config');
const chat = require('./chat');
const plugins = {
    chat
};

run({
    config,
    plugins
});