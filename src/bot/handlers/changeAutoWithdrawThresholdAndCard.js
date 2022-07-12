const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function changeAutoWithdrawThresholdAndCardHandler(ctx) {
  const [, id] = ctx.match

  if (!qiwiAccsManager.hasById(id))
    return await ctx.answerCbQuery(`Аккаунт с таким айди не найден`)

  return await ctx.scene.enter('CHANGE_AUTO_WITHDRAW_THRESHOLD_AND_CARD_SCENE_ID', { qiwiAccId: id })
}
