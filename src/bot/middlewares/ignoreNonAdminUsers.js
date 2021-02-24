const { Context } = require('telegraf')
const settings = require('../../lib/settings').getInstance()

/**
 * @param {Context} ctx
 * @param {Function} next
 */
module.exports = async (ctx, next) => {
  const chatId = ctx.chat?.id

  if (!Number.isFinite(chatId) || !settings.data.tgAdminChatIds.includes(chatId))
    return

  return await next()
}
