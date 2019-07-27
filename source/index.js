const cluster = require('cluster')
const master = require('./master')
const worker = require('./worker')
const defaultConfig = require('../config')

function socketStarter (parameters) {
  const config = Object.assign(defaultConfig, parameters.config || {})
  if (cluster.isMaster) {
    return master(config)
  }
  return worker(config, parameters.plugins)
}

module.exports = socketStarter
