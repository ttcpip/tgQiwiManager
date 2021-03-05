const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function accKeyPairHandler(ctx) {
  const [_, id] = ctx.match

  if (!qiwiAccsManager.hasById(id))
    return await ctx.answerCbQuery(`Аккаунт с таким айди не найден`)

  return await ctx.scene.enter('ACC_KEY_PAIR_SCENE_ID', { qiwiAccId: id })
}
