const net = require('net')
const cluster = require('cluster')
const farmhash = require('farmhash')
const logo = require('./name')

cluster.on('fork', (worker) => {
  console.log(`${logo} worker: ${worker.id} spawned`)
})

cluster.on('exit', (worker, code, signal) => {
  console.warn(`${logo} worker ${worker.process.pid} died\ncode:${code}\nsignal:${signal}`)
})

// This stores our workers. We need to keep them to be able to reference
// them based on source IP address. It's also useful for auto-restart,
// for example.
const workers = []

function spawnWorkers (config) {
  const port = process.env.PORT || config.port

  // Create the outside facing server listening on our port.
  const server = net.createServer({
    pauseOnConnect: true
  }, function (connection) {
    // We received a connection and need to pass it to the appropriate
    // worker. Get the worker for this connection's source IP and pass
    // it the connection.
    const worker = workers[getWorkerIndex(connection.remoteAddress)]
    if (worker) {
      worker.send(config.connectionMessage, connection)
    }
  }).listen(port)

  console.log(`${logo} started at port: ${port}`)

  // Spawn workers.
  for (let i = 0; i < config.totalWorkers; i++) {
    spawnWorker(i)
  }

  return server

  // Helper function for getting a worker index based on IP address.
  // This is a hot path so it should be really fast. The way it works
  // is by converting the IP address to a number by removing non numeric
  // characters, then compressing it to the number of slots we have.
  //
  // Compared against "real" hashing (from the sticky-session code) and
  // "real" IP number conversion, this function is on par in terms of
  // worker index distribution only much faster.
  function getWorkerIndex (ip) {
    return farmhash.fingerprint32(ip) % config.totalWorkers // Farmhash is the fastest and works with IPv6, too
  }
}

/* eslint-disable no-inner-declarations */
// Helper function for spawning worker at index 'i'.
function spawnWorker (i) {
  const fork = cluster.fork()

  // Optional: Restart worker on exit
  fork.on('exit', (code, signal) => {
    console.warn(`${logo} worker exit\ncode:${code}\nsignal:${signal}`)

    spawnWorker(i)
  })

  workers[i] = fork
}

module.exports = spawnWorkers
