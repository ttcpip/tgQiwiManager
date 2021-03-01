/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function callbackQueryUtilCommandsHandler(ctx, next) {
  const cbData = ctx.callbackQuery?.data
  if (cbData && cbData.length > 0) {
    if (cbData.includes('*delMsg*')) {
      ctx.deleteMessage().catch(() => {})
      ctx.callbackQuery.data = ctx.callbackQuery.data.replace('*delMsg', '')
    }
    if (cbData.includes('*delKb*')) {
      ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {})
      ctx.callbackQuery.data = ctx.callbackQuery.data.replace('*delKb', '')
    }
  }

  return await next()
}
