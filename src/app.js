const settings = require('./lib/settings').getInstance()
const initBot = require('./bot')

const main = async () => {
  const bot = await initBot(settings.data.tgBotToken)

  await bot.launch({ allowedUpdates: ['callback_query', 'message'] })
  console.log(`Tg bot started: @${bot.botInfo.username}`)
}
main()
