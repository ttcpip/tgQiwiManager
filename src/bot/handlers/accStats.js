const { Markup } = require('telegraf')
const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const moment = require('../../lib/moment')
const { userFormatNumber } = require('../../lib/utils')

const { escape, bold, monospace } = format
const boldEscape = (str) => bold(escape(str))

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function accStatsHandler(ctx) {
  const id = ctx.match[1]

  if (!qiwiAccsManager.hasById(id))
    return await ctx.answerCbQuery(`Аккаунт с таким айди не найден`)

  ctx.answerCbQuery(`⏳ Получение информации...`).catch(() => {})

  const qiwi = qiwiAccsManager.getById(id)
  const startDate = moment().tz('Europe/Moscow').startOf('month')
  const endDate = moment().tz('Europe/Moscow').endOf('month')
  let err = null
  const { incoming, outgoing } = await qiwi.getStatistics({
    startDate: startDate.toDate(),
    endDate: endDate.toDate(),
    operation: 'ALL',
  }).catch((_err) => { err = _err; return {} })

  if (err) {
    return await ctx.reply(`❌ Ошибка при получении статистики: ${err.message || err.description || '[no err text]'}`, {
      reply_to_message_id: ctx.callbackQuery?.message?.message_id,
      allow_sending_without_reply: true,
    })
  }

  const incomingText = Object.entries(incoming).map(([curr, num]) => `${userFormatNumber(num)} ${curr}`).join('\n')
  const outcomingText = Object.entries(outgoing).map(([curr, num]) => `${userFormatNumber(num)} ${curr}`).join('\n')
  const text = dedent`
    📊 Статистика с ${boldEscape(startDate.format())} по ${boldEscape(endDate.format())}
    
    ${boldEscape('Доходы:')} ${monospace(incomingText)}
    ${boldEscape('Расходы:')} ${monospace(outcomingText)}
  `
  const KB = Markup.inlineKeyboard([[Markup.button.callback('Назад', `statList`)]]).reply_markup

  return await ctx.editMessageText(text, { reply_markup: KB, parse_mode: 'MarkdownV2' })
}
