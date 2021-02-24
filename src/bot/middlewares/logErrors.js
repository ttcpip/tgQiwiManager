const { Context } = require('telegraf')

/**
 * @param {Context} ctx
 * @param {Function} next
 */
module.exports = async (ctx, next) => {
  next().catch((err) => {
    console.error(`Error from top of the bot middlewares:`)
    console.error(err)
  })
}
