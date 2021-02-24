/* eslint-disable global-require */
module.exports = [
  require('./logErrors'),

  require('./logUpdates'),

  require('./ignoreNonAdminUsers'),
  require('./baseCmdsHandler'),
]
