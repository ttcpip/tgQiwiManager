const { Markup } = require('telegraf')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function keyPairListHandler(ctx) {
  const text = `❓ Для какого аккаунта создаем ключи?`
  const rows = qiwiAccsManager
    .getAllAccs()
    .map(([id]) => [Markup.button.callback(id, `*delKb*accKeyPair=${id}`)])
  const KB = Markup.inlineKeyboard([
    ...rows,
    [Markup.button.callback('Назад', `mainMenu`)],
  ]).reply_markup

  return await ctx.editMessageText(text, { reply_markup: KB })
}
