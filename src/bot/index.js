const { Telegraf } = require('telegraf')
const middlewares = require('./middlewares')
const handlers = require('./handlers')

module.exports = (token) => {
  const bot = new Telegraf(token)

  middlewares.forEach((middleware) => bot.use(middleware))

  return bot
}
