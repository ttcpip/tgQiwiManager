const settings = require('./lib/settings').getInstance()
const qiwiAccsManager = require('./lib/QiwiAccsManager').getInstance()

const { initBot } = require('./bot')
const { Qiwi } = require('./lib/Qiwi')

const main = async () => {
  for (const id in settings.data.qiwiAccs) {
    const qiwi = new Qiwi(settings.data.qiwiAccs[id])
    qiwiAccsManager.add(id, qiwi)
  }
  console.log(`Qiwi accs manager started with ${qiwiAccsManager.accs.size} accounts`)

  // const qiwi = new Qiwi({
  //   wallet: '79621579917',
  //   token: 'aa352dc39c2c322fddde2fdd1283bfe6',
  //   proxy: {
  //     host: '188.130.136.81',
  //     port: '4061',
  //     userId: 'nHoR6q',
  //     password: 'R4nh2QR0KS',
  //   },
  // })
  // const { ip } = await qiwi.get({ url: 'https://api.ipify.org?format=json' })
  // console.log({ ip })

  // const smth = await qiwi.getRubAccBalance()
  // console.log(smth)

  const bot = await initBot(settings.data.tgBotToken)
  await bot.launch({ allowedUpdates: ['callback_query', 'message'] })
  console.log(`Tg bot started: @${bot.botInfo.username}`)
}
main()
  .catch((err) => {
    console.error(`Error at main fn:`)
    console.error(err)
  })
