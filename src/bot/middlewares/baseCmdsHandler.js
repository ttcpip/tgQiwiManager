const { Context } = require('telegraf')

/**
 * @param {Context} ctx
 * @param {Function} next
 */
module.exports = async (ctx, next) => {
  const msgText = ctx.message?.text || ''
  switch (msgText) {
  case '/chat':
    return ctx.reply(ctx.chat?.id || 0)
  case '/id':
    return ctx.reply(ctx.from?.id || 0)

  default:
    break
  }

  return await next()
}
