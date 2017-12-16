'use strict'

const express = require('express')
const expressSession = require('express-session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const path = require('path')
const http = require('http')
const cors = require('cors')
const compression = require('compression')
const socketio = require('socket.io')
const MongoStore = require('connect-mongo')(expressSession)
const sticky = require('sticky-cluster')
const stamp = require('console-stamp')
const port = process.env.PORT || 3000

module.exports = function (params) {
  return sticky(
    function (callback) {
      callback(run(params))
    }, {
      concurrency: params.config.workers || 1,
      port,
      debug: true,
      env: function (index) { return { stickycluster_worker_index: index } }
    }
  )
}

function run({
  config = {},
  plugins = {},
  extend = null
}) {

  const app = express()
  const cookie = cookieParser(config.auth.secret)
  const store = new MongoStore(config.store)

  const sessionParams = getSessionParams(store, config)
  const session = expressSession(sessionParams)

  const stampParams = getStampParams(config)
  stamp(console, stampParams)

  app.use(cors())
  app.use(compression())

  app.use(session)
  app.use(cookie)

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))

  serveStatic(app, config)

  // optional extend app
  if (extend) {
    extend(app)
  }

  const server = http.Server(app)
  const io = socketio.listen(server)

  io.set('origins', '*:*')

  Object.keys(plugins).forEach((name) => {
    plugins[name].initialize(io.in(name))
  })

  io.on('connect', (socket) => {
    console.log('[socket] connect', socket.id)
    // require custom handshake
    Object.keys(plugins).forEach((name) => {
      socket.on(`handshake:${name}`, (data) => {
        socket.join(name)
        plugins[name].handshake(socket, data)
      })
    })
  })

  return server
}

function getSessionParams (store, config) {
  return {
    key: config.auth.key || 'express.sid',
    secret: config.auth.secret,
    cookie: config.auth.cookie,
    resave: true,
    saveUninitialized: true,
    store
  }
}

function getStampParams (config) {
  const metadata = (typeof config.metadata === 'function') ? 
    config.metadata : 
    config.metadata ?
      defaultMetadata :
      null
  return {
    metadata,
    colors: config.colors || {}
  }
}

function serveStatic (app, config) {
  // server static public dir
  app.set('view engine', 'html')
  config.static.directories.forEach((directory) => {
    app.use(express.static(path.resolve(directory), config.static.config))
  })
}

function defaultMetadata() {
  return '[' + process.memoryUsage().rss + ']'
}
