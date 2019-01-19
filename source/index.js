const cluster = require('cluster')
const master = require('./master')
const worker = require('./worker')

function socketStarter (parameters) {
  const config = parameters.config || require('../example/config.json')
  if (!parameters.plugins) throw new Error('Add plugins as parameter! (see README.md)')
  if (cluster.isMaster) {
    return master(config)
  } else {
    return worker(config, parameters.plugins)
  }
}

module.exports = socketStarter
module.exports.default = socketStarter
