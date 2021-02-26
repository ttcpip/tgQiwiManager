const { Context } = require('telegraf')

/**
 * @param {Context} ctx
 * @param {Function} next
 */
module.exports = async function logUpdates(ctx, next) {
  const id = ctx.from?.id || 0
  const chat = ctx.chat?.id || 0
  const username = ctx.from?.username || `@0`
  const updateType = ctx.updateType || '[no update type]'

  const msgText = ctx.message?.text || ''
  const queryText = ctx.callbackQuery?.data || ''
  const body = msgText || queryText || '[no body]'

  const maxLength = 100
  const minifiedBody = (
    body.length > maxLength
      ? body.substring(0, maxLength - 3) + '...'
      : body
  ).split('\n').map((line) => line.trim()).join(' ')

  console.log(`[${updateType}] @${username} | ${id} | ${chat} | ${minifiedBody}`)

  return await next()
}
