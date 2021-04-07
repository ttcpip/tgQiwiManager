const dedent = require('dedent')
const TaskLoop = require('../lib/TaskLoop')

class CheckAccBanned {
  /**
   * @param {{
   *  checkBannedIntervalMs: number,
   *  qiwiAccsManager: import('../lib/QiwiAccsManager'),
   *  tgClient: import('../tgClient'),
   *  settings: import('../lib/settings'),
   * }} params
   */
  constructor(params) {
    this.params = params
    this.loop = new TaskLoop({
      intervalMs: 2 * 60000,
      taskFn: this._loopFn.bind(this),
      onTaskErrorCallback: (err) => console.error(`Error at CheckAccBanned: `, err),
    })
  }

  start() {
    this.loop.start()
  }

  async _loopFn() {
    const nowTimeS = Math.trunc(Date.now() / 1000)
    const accsToCheck = this.params.qiwiAccsManager.getAllAccs()
      .filter(([id]) => !this.params.settings.data.qiwiAccs[id].lastTimeCheckBanned
        || (
          this.params.settings.data.qiwiAccs[id].lastTimeCheckBanned
            && nowTimeS - this.params.settings.data.qiwiAccs[id].lastTimeCheckBanned > this.params.checkBannedIntervalMs / 1000
        ))

    if (accsToCheck.length <= 0)
      return

    const promises = accsToCheck.map(([id, qiwi]) => Promise.resolve().then(async () => {
      try {
        let isBanned = null
        let restrictions = null

        try {
          const temp = await qiwi.isAccountBanned()
          isBanned = temp.isBanned
          restrictions = temp.restrictions
        } catch (err) {
          const text = dedent`
            ‼️ При проверке кошелька ${qiwi.wallet} (${id}) на бан произошла ошибка. Вероятно, аккаунт забанен.
            Ошибка: ${err.message || err.description || '[no err message]'}
          `
          this.params.settings.data.tgAdminChatIds.forEach((chat) => this.params.tgClient.sendMessage(chat, text).catch(() => {}))
          return
        }

        this.params.settings.data.qiwiAccs[id].lastTimeCheckBanned = Math.trunc(Date.now() / 1000)
        await this.params.settings.save()

        if (!isBanned)
          return

        const text = dedent`
          ‼️ Зафиксировано, что кошелек был заблокирован: ${qiwi.wallet} (${id})
          Ограничения:
          ${restrictions.map(({ restrictionCode, restrictionDescription }) => `${restrictionCode}: ${restrictionDescription}`).join('\n')}
        `
        this.params.settings.data.tgAdminChatIds.forEach((chat) => this.params.tgClient.sendMessage(chat, text).catch(() => {}))
      } catch (err) {
        console.error(`When processing is banned. Wallet: ${qiwi.wallet} (${id}): `)
        console.error(err)
      }
    }))
    await Promise.all(promises)
  }
}

module.exports = CheckAccBanned
