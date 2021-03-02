const dedent = require('dedent')
const { Markup } = require('telegraf')
const { markdownv2: format } = require('telegram-format')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function walletsBalancesHandler(ctx) {
  ctx.answerCbQuery('💰 Получаю информацию о балансах...').catch(() => {})

  const balances = await qiwiAccsManager.getAllBalances()
  let accsInfoText = ''
  const rows = []
  for (const id in balances) {
    const { balance, err } = balances[id]
    const qiwi = qiwiAccsManager.getById(id)

    const balanceText = !err ? `${balance.toLocaleString('ru-RU')} руб.` : null
    const errText = err ? `[Ошибка: ${err.message || err.description || '<no err msg>'}]` : null
    const accInfo = `${qiwi.wallet} ${id} ${balanceText || errText}\n`
    accsInfoText += accInfo
    rows.push([Markup.button.callback(`Вывод с ${id}`, `withdraw=${id}`)])
  }

  const text = dedent`
    ${format.bold('💰 Балансы: ')}
      
    ${format.monospaceBlock(accsInfoText)}${format.monospaceBlock(`Всего: ${Object.values(balances).reduce((p, c) => p + c.balance, 0)} руб.`)}
  `
  const KB = Markup.inlineKeyboard([
    ...rows,
    [Markup.button.callback('Назад', `mainMenu`)],
  ]).reply_markup

  return await ctx.editMessageText(text, { reply_markup: KB, parse_mode: 'MarkdownV2' })
}
