const {
  updateQiwiRow, qiwiRowStatuses, getNewQiwiRowStatusByErr, buildLastErrField,
} = require('../lib/googleapis/updateQiwiRow')
const moment = require('../lib/moment')
const TaskLoop = require('../lib/TaskLoop')
const { formatProxyObj } = require('../lib/utils')

class CheckQiwiRowsUpdate {
  /**
   * @param {{
   *  checkQiwiRowsUpdateIntervalMs: number,
   *  qiwiAccsManager: import('../lib/QiwiAccsManager'),
   *  tgClient: import('../tgClient'),
   *  settings: import('../lib/settings'),
   * }} params
   */
  constructor(params) {
    this.params = params
    this.loop = new TaskLoop({
      intervalMs: 10 * 1000,
      taskFn: this._loopFn.bind(this),
      onTaskErrorCallback: (err) => console.error(`Error at CheckQiwiRowsUpdate: `, err),
    })
  }

  start() {
    this.loop.start()
  }

  async _loopFn() {
    const nowTimeS = Math.trunc(Date.now() / 1000)
    const accsToCheck = this.params.qiwiAccsManager.getAllAccs()
      .filter(([id]) => !this.params.settings.data.qiwiAccs[id].lastTimeCheckRowsUpdate
        || (
          this.params.settings.data.qiwiAccs[id].lastTimeCheckRowsUpdate
            && nowTimeS - this.params.settings.data.qiwiAccs[id].lastTimeCheckRowsUpdate > this.params.checkQiwiRowsUpdateIntervalMs / 1000
        ))

    if (accsToCheck.length <= 0)
      return

    const getOnUpdateErrFn = (updatingFields) => (err) => console.error(`at updateQiwiRow()`, updatingFields, err)
    const promises = accsToCheck.map(([id, qiwi]) => Promise.resolve().then(async () => {
      try {
        this.params.settings.data.qiwiAccs[id].lastTimeCheckRowsUpdate = Math.trunc(Date.now() / 1000)
        await this.params.settings.save()
      } catch (err) {
        console.error(`Err when updating lastTimeCheckRowsUpdate for qiwi ${qiwi.wallet}`, err)
        return
      }

      try {
        console.log(`At CheckQiwiRowsUpdate starting checking acc ${qiwi.wallet} (${id})`)

        const stats = await qiwi.getStatistics({
          startDate: moment().tz('Europe/Moscow').startOf('month').toDate(),
          endDate: moment().tz('Europe/Moscow').endOf('month').toDate(),
          operation: 'ALL',
        })
        const income = stats?.incoming.RUB || 0
        const costs = stats?.outgoing.RUB || 0
        /** @type {import('../lib/googleapis/updateQiwiRow').QiwiRowFields} */

        const balance = await qiwi.getRubAccBalance()

        const updatingFields = {
          walletNumber: qiwi.wallet,
          income,
          costs,
          apiToken: qiwi.token,
          password: id,
          balance,
          proxy: formatProxyObj(qiwi.proxy),
          status: qiwiRowStatuses.limit,
        }
        const onUpdateErrFn = getOnUpdateErrFn(updateQiwiRow)

        if (costs > 190000)
          return await updateQiwiRow(updatingFields).catch(onUpdateErrFn)

        const { restrictions } = await qiwi.isAccountBanned()
        if (restrictions.length > 0)
          throw new Error(`Account banned, restrictions: ${restrictions.map(({ restrictionCode, restrictionDescription }) => `${restrictionCode}: ${restrictionDescription}`).join(', ')}`)

        updatingFields.status = qiwiRowStatuses.work
        await updateQiwiRow(updatingFields).catch(onUpdateErrFn)
      } catch (err) {
        const updatingFields = {
          walletNumber: qiwi.wallet,
          status: getNewQiwiRowStatusByErr(err),
          lastErr: buildLastErrField(err),
        }

        await updateQiwiRow(updatingFields).catch(getOnUpdateErrFn(updatingFields))
      }
    }))

    await Promise.all(promises)
  }
}

module.exports = CheckQiwiRowsUpdate
