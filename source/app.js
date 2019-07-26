const express = require('express')
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const connectMongo = require('connect-mongo')
const MongoClient = require('mongodb')
const cors = require('cors')
const compression = require('compression')
const bodyParser = require('body-parser')
const path = require('path')

// returns secret string password for sessions / cookies
function getSecret (config) {
  return config.sessionParams.secret || 'TheCakeIsALie'
}

// creates cookie parser based on configuration
function createCookieParser (config) {
  return cookieParser(getSecret(config))
}

function testForMongoDB (config) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(config.mongoStore.url, { useNewUrlParser: true }, (err) => {
      (err && reject(err)) || resolve()
    })
  })
}

// extends config sessionparams with mongo store
// does not throw exception if no mongo instance is available
async function addMongoStore (config) {
  try {
    if (await testForMongoDB(config)) {
      const Session = connectMongo(expressSession)
      config.sessionParams.store = new Session(config.mongoStore)
    }
  } catch (err) {
    console.warn(`socket-starter🚀 mongodb not configured, but that's ok`)
  }
}

// Creates express app, adds express plugins, extends app
async function createApp (config) {
  const app = express()

  app.use(cors())
  app.use(compression())

  config.mongoStore && await addMongoStore(config)

  app.use(expressSession(config.sessionParams))
  app.use(createCookieParser(config))

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
