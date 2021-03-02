const { Markup } = require('telegraf')
const { markdownv2: format } = require('telegram-format')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function statListHandler(ctx) {
  const text = `❓ Для какого аккаунта запросить статистику?`
  const rows = qiwiAccsManager
    .getAllAccs()
    .map(([id]) => [Markup.button.callback(id, `accStats=${id}`)])
  const KB = Markup.inlineKeyboard([
    ...rows,
    [Markup.button.callback('Назад', `mainMenu`)],
  ]).reply_markup

  return await ctx.editMessageText(text, { reply_markup: KB, parse_mode: 'MarkdownV2' })
}
