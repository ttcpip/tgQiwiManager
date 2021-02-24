const { Context } = require('telegraf')

function telegrafLogger(_opts) {
  const defaultParams = {
    logFn: console.log,
    logErrFn: console.error,
  }
  const opts = { ...defaultParams, ..._opts }

  /**
   * @param {Context} ctx
   */
  const telegrafLoggerCallback = async (ctx, next) => {
    try {
      const id = ctx.from?.id || 0
      const chat = ctx.chat?.id || 0
      const username = ctx.from?.username || `@0`
      const updateType = ctx.updateType || '[no update type]'

      const msgText = ctx.message?.text || ''
      const queryText = ctx.callbackQuery?.data || ''

      const body = msgText || queryText || '[no body]'
      const maxLength = 100
      let minifiedBody = body.length > maxLength
        ? body.substring(0, maxLength - 3) + '...'
        : body
      minifiedBody = minifiedBody.replace(/\n/g, ' ')

      opts.logFn(`[${updateType}] @${username} | ${id} | ${chat}. ${minifiedBody}`)
    } catch (err) {
      opts.logErrFn('When logging bot msg: ', err)
    }

    return next()
  }

  return telegrafLoggerCallback
}

module.exports = telegrafLogger
