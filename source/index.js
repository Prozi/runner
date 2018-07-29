'use strict'

// Dependencies
const cluster = require('cluster')
const port = process.env.PORT || 3000

// This stores our workers. We need to keep them to be able to reference
// them based on source IP address. It's also useful for auto-restart,
// for example.
const workers = []

// Connection message - string constant
const CONNECTION_MESSAGE = 'sticky-session:connection'

// This is what will be exported
function main ({ config = {}, plugins = {}, extend = null, app = null }) {
  if (cluster.isMaster) {
    // Lazy load dependencies
    const net = require('net')
    const farmhash = require('farmhash')

    // Get from config
    const totalWorkers = config.workers || 1

    // Spawn workers.
    for (let i = 0; i < totalWorkers; i++) {
      spawnWorker(i)
    }

    // Create the outside facing server listening on our port.
    net.createServer({ pauseOnConnect: true }, function (connection) {
      // We received a connection and need to pass it to the appropriate
      // worker. Get the worker for this connection's source IP and pass
      // it the connection.
      const worker = workers[getWorkerIndex(connection.remoteAddress)]
      if (worker) {
        worker.send(CONNECTION_MESSAGE, connection)
      }
    }).listen(port)

    /* eslint-disable no-inner-declarations */
    // Helper function for spawning worker at index 'i'.
    function spawnWorker (i) {
      workers[i] = cluster.fork()

      // Optional: Restart worker on exit
      workers[i].on('exit', function (code, signal) {
        console.warn(`socket-starter: respawning worker ${i}`)
        spawnWorker(i)
      })
    }

    // Helper function for getting a worker index based on IP address.
    // This is a hot path so it should be really fast. The way it works
    // is by converting the IP address to a number by removing non numeric
    // characters, then compressing it to the number of slots we have.
    //
    // Compared against "real" hashing (from the sticky-session code) and
    // "real" IP number conversion, this function is on par in terms of
    // worker index distribution only much faster.
    function getWorkerIndex (ip) {
      return farmhash.fingerprint32(ip) % totalWorkers // Farmhash is the fastest and works with IPv6, too
    }
  } else {
    const expressApp = app || createApp(config)
    if (extend) {
      extend(expressApp)
    }
    createIO(expressApp, plugins, config)
  }
}

// Creates express app, adds express plugins, extends app
function createApp (config) {
  // Lazy load dependencies
  const express = require('express')
  const cookieParser = require('cookie-parser')
  const expressSession = require('express-session')
  const MongoStore = require('connect-mongo')(expressSession)
  const stamp = require('console-stamp')
  const cors = require('cors')
  const compression = require('compression')
  const bodyParser = require('body-parser')
  const path = require('path')

  const app = express()
  const cookie = cookieParser(config.auth.secret)
  const store = new MongoStore(config.store)

  const sessionParams = getSessionParams(store, config)
  const session = expressSession(sessionParams)

  stamp(console, getStampParams(config))

  app.use(cors())
  app.use(compression())

  app.use(session)
  app.use(cookie)

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))

  config.static.directories.forEach((directory) => {
    app.use(express.static(path.resolve(directory), config.static.config))
  })

  return app
}

// Creates Socket IO instance on express app, with socket-starter plugins
function createIO (app, plugins, config) {
  const socketio = require('socket.io')

  // Note we don't use a port here because the master listens on it for us.
  // Don't expose our internal server to the outside.
  listen(app, config).then((server) => {

    const io = socketio(server)

    // Tell Socket.IO to use the redis adapter. By default, the redis
    // server is assumed to be on localhost:6379. You don't have to
    // specify them explicitly unless you want to change them.
    // io.adapter(sio_redis(redis_uri))

    // Allow connection from any origin
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

    // Listen to messages sent from the master. Ignore everything else.
    process.on('message', (message, connection) => {
      if (message === CONNECTION_MESSAGE) {
        // Emulate a connection event on the server by emitting the
        // event with the connection the master sent us.
        server.emit('connection', connection)

        connection.resume()
      }
    })
  })
}

// ----
// Helper functions for socket-starter

function listen (app, config) {
  if (config.listen) {
    return config.listen(app)
  } else {
    return new Promise((resolve) => resolve(app.listen()))
  }
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
  const metadata = (typeof config.metadata === 'function')
    ? config.metadata
    : config.metadata
      ? defaultMetadata
      : null
  return {
    metadata,
    colors: config.colors || {}
  }
}

function defaultMetadata () {
  return '[' + process.memoryUsage().rss + ']'
}

// ----
// Exports

module.exports = main

module.exports.default = module.exports
