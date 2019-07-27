const master = require('./master')
const worker = require('./worker')
const defaultConfig = require('../config')

function start({ config, plugins }) {
  const setup = Object.assign({}, defaultConfig, config || {})

  if (setup.isMaster) {
    return master(setup)
  }
  return worker(setup, plugins)
}

module.exports = start
