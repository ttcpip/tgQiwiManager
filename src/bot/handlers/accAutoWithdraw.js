const { Markup } = require('telegraf')
const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const settings = require('../../lib/settings').getInstance()

const { escape, bold, monospace } = format
const boldEscape = (str) => bold(escape(str))

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function accAutoWithdrawHandler(ctx) {
  const [, id] = ctx.match

  if (!qiwiAccsManager.hasById(id))
    return await ctx.answerCbQuery(`Аккаунт с таким айди не найден`)

  const qiwi = qiwiAccsManager.getById(id)
  const { on, thresholdToWithdraw, card } = settings.data.qiwiAccs[id].autoWithdraw

  const text = dedent`
    ❗️ Киви: ${boldEscape(qiwi.wallet)} ${monospace(`(${id})`)}
    • ${escape('Авто-вывод:')} ${monospace(on ? '✅Включен' : '❌Выключен')}
    • ${escape('Порог для авто-вывода:')} ${monospace(`${thresholdToWithdraw || 'Не установлен'}`)}
    • ${escape('Карта:')} ${monospace(`${card || 'Не установлена'}`)}
    ❓ Что делаем?
  `
  const KB = Markup.inlineKeyboard([
    [Markup.button.callback('Вкл/выкл', `onOffAutoWithdraw=${id}`)],
    [Markup.button.callback('Изменить сумму/карту', `changeAutoWithdrawThresholdAndCard=${id}`)],
    [Markup.button.callback('Назад', `autoWithdrawList`)],
  ]).reply_markup
  const extra = { reply_markup: KB, parse_mode: 'MarkdownV2' }

  return ctx.callbackQuery
    ? await ctx.editMessageText(text, extra)
    : await ctx.reply(text, extra)
}
