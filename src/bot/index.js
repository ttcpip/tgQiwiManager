const { Telegraf, Scenes: { Stage }, session } = require('telegraf')
const middlewares = require('./middlewares')
const scenes = require('./scenes')
const handlers = require('./handlers')

module.exports.initBot = function initBot(token) {
  const bot = new Telegraf(token)

  // Middlewares
  bot.use(middlewares.logErrors)
  bot.use(middlewares.logUpdates)
  bot.use(middlewares.ignoreNonAdminUsers)
  bot.on('callback_query', middlewares.callbackQueryUtilCommandsHandler)
  bot.on('text', middlewares.baseCmdsHandler)
  bot.on('text', middlewares.adminCmdsHandler)

  // Scenes
  bot.use(session())
  bot.use(new Stage(Object.values(scenes)).middleware())

  // Logic
  bot.action('walletsBalances', handlers.walletsBalancesHandler)
  bot.action('walletsList', handlers.walletsListHandler)
  bot.action(/withdraw=(.+)/, handlers.withdrawHandler)
  bot.action('addQiwi', Stage.enter('ADD_QIWI_SCENE_ID'))
  bot.action('delQiwi', Stage.enter('DEL_QIWI_SCENE_ID'))
  bot.action('proxy', Stage.enter('PROXY_MAIN_SCENE_ID'))
  bot.action('statList', handlers.statListHandler)
  bot.action(/accStats=(.+)/, handlers.accStatsHandler)
  bot.action(/historyList=(.+)/, handlers.historyListHandler)
  bot.action(/accHistory=(.+)=(.+)/, handlers.accHistoryHandler)

  // Defaults
  bot.on('message', Stage.enter('MAIN_MENU_SCENE_ID'))
  bot.action('mainMenu', Stage.enter('MAIN_MENU_SCENE_ID'))
  bot.on('callback_query', (ctx) => ctx.answerCbQuery('No handler'))

  return bot
}
