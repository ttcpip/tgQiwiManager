const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const settings = require('../../lib/settings').getInstance()

/** @param {import('telegraf').Context} ctx */
module.exports = async function actualizeQiwiRows(ctx) {
  for (const [id] of qiwiAccsManager.getAllAccs()) {
    if (!settings.data.qiwiAccs[id]) continue
    settings.data.qiwiAccs[id].lastTimeCheckRowsUpdate = 0
  }
  await settings.save()
  await ctx.answerCbQuery(`✅Табличка скоро будет актуализирована`)
}
