const { Markup } = require('telegraf')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function autoWithdrawListHandler(ctx) {
  const text = `❓ Для какого аккаунта настраиваем авто-вывод?`
  const rows = qiwiAccsManager
    .getAllAccs()
    .map(([id]) => [Markup.button.callback(id, `accAutoWithdraw=${id}`)])
  const KB = Markup.inlineKeyboard([
    ...rows,
    [Markup.button.callback('Назад', `mainMenu`)],
  ]).reply_markup

  return await ctx.editMessageText(text, { reply_markup: KB })
}
