// const { Markup } = require('telegraf')
// const { markdownv2: format } = require('telegram-format')
// const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function withdrawHandler(ctx) {
  const id = ctx.match[1]

  return await ctx.scene.enter('WITHDRAW_SCENE_ID', { qiwiAccId: id })
}
