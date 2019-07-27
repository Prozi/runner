const os = require('os')
const start = require('../source')
const chat = require('./chat')

start({
  plugins: {
    chat
  },
  config: {
    totalWorkers: os.cpus().length,
    static: {
      directories: ['example/static']
    }
  }
})
