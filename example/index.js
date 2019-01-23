const os = require('os')
const socketStarter = require('../index.js')
const chat = require('./chat.js')

socketStarter({
  config: {
    totalWorkers: os.cpus().length,
    port: 3000,
    static: {
      directories: ['example/static']
    }
  },
  plugins: {
    chat
  }
})