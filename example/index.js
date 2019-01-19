require('../source/index.js')({
  config: require('./config.json'),
  plugins: {
    chat: require('./chat.js')
  }
})
