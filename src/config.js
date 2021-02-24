const settings = require('./lib/settings').getInstance()

module.exports = {
  tgBotToken: settings.data.tgBotToken,
}
