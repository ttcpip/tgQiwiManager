const { Markup } = require('telegraf')
const { markdownv2: format } = require('telegram-format')
const { smartChunkStr } = require('../../helpers/smartChunkStr')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function walletsListHandler(ctx) {
  const accsInfo = qiwiAccsManager.getAllAccs()
    .map(([id, qiwi], i) => `${i + 1}) ${qiwi.wallet} ${id}`)
    .join('\n')
  const text = `📋 Аккаунты:\n${format.monospaceBlock(accsInfo)}`
  const KB = Markup.inlineKeyboard([
    [Markup.button.callback('Добавить киви', '*delKb*addQiwi')],
    [Markup.button.callback('Удалить киви', '*delKb*delQiwi')],
    [Markup.button.callback('Создать ключи', 'keyPairList')],
    [Markup.button.callback('Назад', 'mainMenu')],
  ]).reply_markup

  ctx.answerCbQuery().catch(() => {})
  const arr = smartChunkStr(text, 4096)
  for (let i = 0; i < arr.length; i++) {
    if (i === arr.length - 1)
      await ctx.reply(arr[i], { reply_markup: KB, parse_mode: 'MarkdownV2' })
    else
      await ctx.reply(arr[i], { parse_mode: 'MarkdownV2' })
  }

  return true
}
