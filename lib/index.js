const master = require('./master')
const worker = require('./worker')
const defaultConfig = require('../config')

async function start ({ config, plugins }) {
  const setup = Object.assign({}, defaultConfig, config || {})

  if (setup.isMaster && setup.totalWorkers > 0) {
    master(setup)
  } else {
    await worker(setup, plugins)
  }
}

module.exports = start
