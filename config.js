module.exports = {
  port: process.env.PORT | 8080,
  totalWorkers: process.env.WEB_CONCURRENCY || 1,
  sessionParams:
  {
    key: 'socket-starter',
    secret: 'TheCakeIsALie',
    resave: true,
    saveUninitialized: true
  },
  connectionMessage: 'sticky-session:connection',
  mongoStore: { url: 'mongodb://localhost:27017/', collection: 'sessions' },
  static: { directories: ['static'] }
}