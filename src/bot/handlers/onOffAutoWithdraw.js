const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const settings = require('../../lib/settings').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function onOffAutoWithdrawHandler(ctx) {
  const [, id] = ctx.match

  if (!qiwiAccsManager.hasById(id))
    return await ctx.answerCbQuery(`Аккаунт с таким айди не найден`)

  settings.data.qiwiAccs[id].autoWithdraw.on = !settings.data.qiwiAccs[id].autoWithdraw.on
  await settings.save()

  return require('./accAutoWithdraw')(ctx)
}
