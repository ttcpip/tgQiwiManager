const settings = require('../../lib/settings').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function ignoreNonAdminUsers(ctx, next) {
  const chatId = ctx.chat?.id

  if (!Number.isFinite(chatId) || !settings.data.tgAdminChatIds.includes(chatId))
    return

  return await next()
}
