const express = require('express')
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const connectMongo = require('connect-mongo')
const cors = require('cors')
const compression = require('compression')
const bodyParser = require('body-parser')
const path = require('path')

// Creates express app, adds express plugins, extends app
function createApp (config) {
  const Session = connectMongo(expressSession)
  config.sessionParams.store = new Session(config.mongoStore)

  const app = express()
  const sessions = expressSession(config.sessionParams)
  const cookies = cookieParser(config.mongoStore.secret)

  app.use(cors())
  app.use(compression())

  app.use(sessions)
  app.use(cookies)

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({
    extended: false
  }))

  config.static.directories.forEach((directory) => {
    app.use(express.static(path.resolve(directory), config.static.config))
  })

  return app
}

module.exports = createApp
module.exports.default = createApp
