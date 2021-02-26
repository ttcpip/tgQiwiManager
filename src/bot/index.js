const { Telegraf } = require('telegraf')
const { applyMiddlewares } = require('./middlewares')
const handlers = require('./handlers')

module.exports.initBot = function initBot(token) {
  const bot = new Telegraf(token)

  applyMiddlewares(bot)

  bot.action('walletsBalances', handlers.walletsBalancesHandler)
  bot.action('walletsList', handlers.walletsListHandler)

  bot.on('message', handlers.mainMenuHandler)
  bot.action('mainMenu', handlers.mainMenuHandler)
  bot.on('callback_query', (ctx) => ctx.answerCbQuery('No handler'))

  return bot
}
