const { Telegraf } = require('telegraf')
const logErrors = require('./logErrors')
const logUpdates = require('./logUpdates')
const ignoreNonAdminUsers = require('./ignoreNonAdminUsers')
const baseCmdsHandler = require('./baseCmdsHandler')

module.exports = {
  /**
   * @param {Telegraf} bot
   */
  applyMiddlewares: (bot) => {
    bot.use(logErrors)
    bot.use(logUpdates)
    bot.use(ignoreNonAdminUsers)
    bot.on('text', baseCmdsHandler)
  },
}
