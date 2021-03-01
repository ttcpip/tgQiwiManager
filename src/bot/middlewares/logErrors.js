/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function logErrors(ctx, next) {
  return await next().catch((err) => {
    console.error(`Error from top of the bot middlewares:`)
    console.error(err)
  })
}
