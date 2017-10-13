'use strict';

const run = require('..');
const config = require('./config');
const chat = require('./chat');
const plugins = {
  chat
};

run({
  config,
  plugins
});