const cluster = require('cluster')

module.exports = {
  isMaster: cluster.isMaster,
  port: process.env.PORT || 8080,
  totalWorkers: process.env.WEB_CONCURRENCY || 1,
  socket: {
    origins: '*:*',
    connectionMessage: 'sticky-session:connection'
  },
  sessionParams:
  {
    key: 'socket-starter',
    secret: 'TheCakeIsALie',
    resave: true,
    saveUninitialized: true
  },
  mongoStore: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/',
    collection: 'sessions'
  },
  static: {
    directories: ['static']
  }
}