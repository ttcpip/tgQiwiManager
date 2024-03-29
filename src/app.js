require('dotenv').config({ path: '.env' })
require('./configUtil')
const config = require('./config')
const settings = require('./lib/settings').getInstance()
require('./lib/ExternalApiClient').getInstance({ apiKey: config.externalApiKey })
const qiwiAccsManager = require('./lib/QiwiAccsManager').getInstance()
const eventHandlers = require('./eventHandlers')

const { initBot } = require('./bot')
const tgClient = require('./tgClient')
const { Qiwi } = require('./lib/Qiwi')
const workers = require('./workers')

const main = async () => {
  const startTime = Date.now()
  console.log(`↓ Initialization started ↓`)

  qiwiAccsManager.onQiwiApiError = eventHandlers.onQiwiApiError
  for (const id in settings.data.qiwiAccs) {
    const qiwi = new Qiwi(settings.data.qiwiAccs[id])
    qiwiAccsManager.add(id, qiwi)
  }
  console.log(`Qiwi accs manager started with ${qiwiAccsManager.accs.size} accounts`)

  const bot = await initBot(config.tgBotToken)
  await bot.launch({ allowedUpdates: ['callback_query', 'message'] })
  console.log(`Tg bot started: @${bot.botInfo.username}`)

  const tgClientInfo = await tgClient.getMe()
  console.log(`Tg client started: @${tgClientInfo.username}`)

  const autoWithdrawWorker = new workers.AutoWithdraw({
    checkBalanceIntervalMs: config.autoWithdrawCheckBalanceIntervalMs,
    qiwiAccsManager,
    settings,
    tgClient,
  })
  autoWithdrawWorker.start()
  console.log(`Auto withdraw worker started with interval ${config.autoWithdrawCheckBalanceIntervalMs / 1000}s`)

  const checkAccBanned = new workers.CheckAccBanned({
    checkBannedIntervalMs: config.checkBannedIntervalMs,
    qiwiAccsManager,
    settings,
    tgClient,
  })
  checkAccBanned.start()
  console.log(`Check acc banned worker started with interval ${config.checkBannedIntervalMs / 1000}s`)

  const checkQiwiRowsUpdate = new workers.CheckQiwiRowsUpdate({
    checkQiwiRowsUpdateIntervalMs: config.checkQiwiRowsUpdateIntervalMs,
    qiwiAccsManager,
    settings,
    tgClient,
  })
  checkQiwiRowsUpdate.start()
  console.log(`Check qiwi rows update worker started with interval ${config.checkQiwiRowsUpdateIntervalMs / 1000}s`)

  console.log(`↑ Initialization ended after ${Date.now() - startTime}ms ↑`)
}

main()
  .catch((err) => {
    console.error(`Error at main fn:`)
    console.error(err)
  })
