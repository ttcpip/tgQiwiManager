const dedent = require('dedent')
const moment = require('../lib/moment')
const config = require('../config')
const { userFormatNumber } = require('../lib/utils')
const settings = require('../lib/settings').getInstance()
const tgClient = require('../tgClient')

/**
 * @param {string} id
 * @param {import('../lib/Qiwi').Qiwi} qiwi
 * @param {Object} withdrawInfo
 * @param {number=} withdrawInfo.amount
 * @param {string=} withdrawInfo.card
 */
module.exports = async function onWithdraw(id, qiwi, withdrawInfo) {
  try {
    const startDate = moment().tz('Europe/Moscow').startOf('month')
    const endDate = moment().tz('Europe/Moscow').endOf('month')
    const { outgoing } = await qiwi.getStatistics({
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      operation: 'ALL',
    })
    const withdrawedRubAmount = outgoing.RUB
    if (!Number.isFinite(withdrawedRubAmount) || withdrawedRubAmount < config.withdrowedAmountToNotify)
      return

    const text = dedent`
      ❗️ Сумма вывода за этот месяц - ${userFormatNumber(withdrawedRubAmount)}. Это больше указанного порога ${userFormatNumber(userFormatNumber)} руб.
      🐤 Киви: ${qiwi.wallet} (${id})
    `
    settings.data.tgAdminChatIds.forEach((chat) => tgClient.sendMessage(chat, text).catch(() => {}))
  } catch (err) {
    console.error(`At onWithdraw event handler for qiwi id ${id}, wallet ${qiwi.wallet}: `)
    console.error(err)
  }
}
