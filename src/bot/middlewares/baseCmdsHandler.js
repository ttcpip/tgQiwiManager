/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function baseCmdsHandler(ctx, next) {
  const msgText = ctx.message?.text || ''
  switch (msgText) {
  case '/chat':
    return await ctx.reply(ctx.chat?.id || 0)
  case '/id':
    return await ctx.reply(ctx.from?.id || 0)

  default:
    break
  }

  /**
   * Handling /leave command because this middleware applies
   * before scenes middleware, it means that
   * before 'await next()' ctx.scene is undefined
   */
  return await next().then((smth) => {
    if (ctx.message?.text === '/leave' && ctx.scene && ctx.scene.leave) {
      return ctx.scene.leave()
        .then(() => ctx.reply(`Вышел с текущей сцены`))
        .catch(() => {})
    }
    return smth
  })
}
