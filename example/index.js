const start = require('../source')
const chat = require('./chat')

start({
  port: 3000,
  plugins: {
    chat
  },
  config: {
    static: {
      directories: ['example/static']
    }
  }
})
