const net = require('net')
const cluster = require('cluster')
const farmhash = require('farmhash')
const logo = require('./name')

function master(setup) {

  cluster.on('fork', (worker) => {
    console.log(`${logo} worker: ${worker.id} spawned`)
  })

  // Spawn workers.
  setup.workers = new Array(setup.totalWorkers)
    .fill(0)
    .map(() => cluster.fork())

  // Create the outside facing server listening on our port.
  setup.master = net.createServer({
    pauseOnConnect: true
  }, function (connection) {
    // We received a connection and need to pass it to the appropriate
    // worker. Get the worker for this connection's source IP and pass
    // it the connection.
    const worker = setup.workers[
      farmhash.fingerprint32(connection.remoteAddress) % setup.workers.length
    ]
    if (worker) {
      worker.send(setup.socket.connectionMessage, connection)
    }
  }).listen(setup.port)

  console.log(`${logo} started at port: ${setup.port}`)

  return setup
}

module.exports = master
