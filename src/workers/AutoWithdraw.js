const dedent = require('dedent')
const TaskLoop = require('../lib/TaskLoop')

class AutoWithdraw {
  /**
   * @param {{
   *  checkBalanceIntervalMs: number,
   *  qiwiAccsManager: import('../lib/QiwiAccsManager'),
   *  tgClient: import('../tgClient'),
   *  settings: import('../lib/settings'),
   * }} params
   */
  constructor(params) {
    this.params = params
    this.loop = new TaskLoop({
      intervalMs: 20000,
      taskFn: this._loopFn.bind(this),
      onTaskErrorCallback: (err) => console.error(`Error at AutoWithdraw: `, err),
    })
  }

  start() {
    this.loop.start()
  }

  async _loopFn() {
    const nowTimeS = Math.trunc(Date.now() / 1000)
    const accsToCheck = this.params.qiwiAccsManager.getAllAccs()
      .filter(([id]) => this.params.settings.data.qiwiAccs[id].autoWithdraw
        && this.params.settings.data.qiwiAccs[id].autoWithdraw.on
        && Number.isFinite(this.params.settings.data.qiwiAccs[id].autoWithdraw.thresholdToWithdraw)
        && this.params.settings.data.qiwiAccs[id].autoWithdraw.card
        && nowTimeS - this.params.settings.data.qiwiAccs[id].autoWithdraw.lastTimeCheckBalance > this.params.checkBalanceIntervalMs / 1000)

    if (accsToCheck.length <= 0)
      return

    const promises = accsToCheck.map(([id, qiwi]) => Promise.resolve().then(async () => {
      try {
        const { thresholdToWithdraw: threshold, card } = this.params.settings.data.qiwiAccs[id].autoWithdraw

        const balance = await qiwi.getRubAccBalance()
        this.params.settings.data.qiwiAccs[id].autoWithdraw.lastTimeCheckBalance = Math.trunc(Date.now() / 1000)
        await this.params.settings.save()

        if (balance < threshold)
          return

        const { message: providerId } = await qiwi.detectCard(card)
        if (!providerId)
          throw new Error(`Invalid providerId got`)
        const { qwCommission: { amount: comission } } = await qiwi.checkOnlineCommission(providerId, { account: card, amount: balance })
        if (!Number.isFinite(comission))
          throw new Error(`Invalid comission got`)

        const amountToWithdraw = balance - comission
        if (amountToWithdraw <= 0)
          throw new Error(`balance - comission <= 0`)

        await qiwi.sendRubToCard({
          amount: amountToWithdraw,
          card,
          providerId,
        })

        const text = dedent`
          ✅ Успешный авто-вывод ${amountToWithdraw} руб с кошелька ${qiwi.wallet} (${id}).
          Баланс до вывода: ${balance}
          Комиссия перевода: ${comission}
        `
        this.params.settings.data.tgAdminChatIds.forEach((chat) => this.params.tgClient.sendMessage(chat, text).catch(() => {}))
      } catch (err) {
        console.error(`When processing auto withdraw. Wallet: ${qiwi.wallet} (${id}): `)
        console.error(err)
      }
    }))
    await Promise.all(promises)
  }
}

module.exports = AutoWithdraw
