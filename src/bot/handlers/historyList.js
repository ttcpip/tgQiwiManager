const { Markup } = require('telegraf')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function historyListHandler(ctx) {
  const [, type] = ctx.match

  const word = type === 'IN'
    ? 'входящую'
    : type === 'OUT'
      ? 'исходящую'
      : 'всю'
  const text = `❓ Для какого аккаунта запросить ${word} историю?`
  const rows = qiwiAccsManager
    .getAllAccs()
    .map(([id]) => [Markup.button.callback(id, `accHistory=${id}=${type}`)])
  const KB = Markup.inlineKeyboard([
    [
      Markup.button.callback(`${type === 'IN' ? '• ' : ' '}➕`, `historyList=IN`),
      Markup.button.callback(`${type === 'OUT' ? '• ' : ' '}➖`, `historyList=OUT`),
      Markup.button.callback(`${type !== 'IN' && type !== 'OUT' ? '• ' : ' '}➕➖`, `historyList=ALL`),
    ],
    ...rows,
    [
      Markup.button.callback('Назад', `mainMenu`),
    ],
  ]).reply_markup

  return await ctx.editMessageText(text, { reply_markup: KB, parse_mode: 'MarkdownV2' })
}
