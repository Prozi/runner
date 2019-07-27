const os = require('os')
const start = require('../source')
const chat = require('./chat')

start({
  plugins: {
    chat
  },
  config: {
    totalWorkers: os.cpus().length,
    port: 3000,
    static: {
      directories: ['example/static']
    }
  }
})
