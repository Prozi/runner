const net = require('net')
const cluster = require('cluster')
const farmhash = require('farmhash')

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

  console.log(`socket-starter🚀 started at port: ${port}`)

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
function spawnWorker (i, respawn) {
  workers[i] = cluster.fork()

  // Optional: Restart worker on exit
  workers[i].on('exit', function (code, signal) {
    spawnWorker(i, true)
  })

  console[respawn ? 'warn' : 'log'](`socket-starter🚀 ${respawn ? 're' : ''}spawned worker number: ${i + 1}`)
}

module.exports = spawnWorkers
module.exports.default = spawnWorkers

cluster.on('exit', () => {
  // kill the other workers
  workers.forEach((worker) => worker.kill())
  // exit the master process
  process.exit(0)
})
