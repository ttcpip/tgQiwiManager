const { Markup } = require('telegraf')
const { markdownv2: format } = require('telegram-format')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function walletsListHandler(ctx) {
  const accsInfo = qiwiAccsManager.getAllAccs()
    .map(([id, qiwi], i) => `${i + 1}) ${qiwi.wallet} ${id}`)
    .join('\n')
  const text = `Аккаунты:\n${format.monospaceBlock(accsInfo)}`
  const KB = Markup.inlineKeyboard([
    [Markup.button.callback('Добавить киви', 'addQiwi')],
    [Markup.button.callback('Удалить киви', 'delQiwi')],
    [Markup.button.callback('Назад', 'mainMenu')],
  ]).reply_markup

  return await ctx.editMessageText(text, { reply_markup: KB, parse_mode: 'MarkdownV2' })
}
