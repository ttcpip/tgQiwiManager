const { Markup } = require('telegraf')
const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const moment = require('../../lib/moment')
const { userFormatNumber } = require('../../lib/utils')

const { escape, bold, monospaceBlock } = format
const boldEscape = (str) => bold(escape(str))

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function accHistoryHandler(ctx) {
  const [_, id, _type] = ctx.match
  const type = ['IN', 'OUT', 'ALL'].includes(_type) ? _type : 'ALL'
  const rows = 10

  if (!qiwiAccsManager.hasById(id))
    return await ctx.answerCbQuery(`Аккаунт с таким айди не найден`)

  ctx.answerCbQuery(`⏳ Получение информации...`).catch(() => {})

  const qiwi = qiwiAccsManager.getById(id)
  let err = null
  const data = await qiwi.getOperations({
    rows,
    operation: type,
  })
    .catch((_err) => { err = _err; return {} })

  if (err) {
    return await ctx.reply(`❌ Ошибка при получении истории: ${err.message || err.description || '[no err text]'}`, {
      reply_to_message_id: ctx.callbackQuery?.message?.message_id,
      allow_sending_without_reply: true,
    })
  }

  const f = (delimeter, text) => (text ? `${delimeter}${text}` : '')
  const historyText = data
    .map(({
      sum, currency, account, providerShortName, statusText, comment, error, date, typeText,
    }, i) => dedent`
      ${i + 1}) ${userFormatNumber(sum)} ${currency} на ${account}
      Дата: ${moment(date).format()}
      Тип: ${typeText}
      Провайдер: ${providerShortName}
      Статус: ${statusText} ${f('\nКомментарий: ', comment)} ${f('\nОшибка: ', error)}
    `)
    .join('\n')
  const text = dedent`
    📊 ${type === 'IN' ? 'Входящая' : type === 'OUT' ? 'Исходящая' : 'Вся'} история для аккаунта ${boldEscape(id)}:
    ${escape(`(Максимум отображается - ${rows} элементов)`)}

    ${monospaceBlock(historyText)}
  `
  const KB = Markup.inlineKeyboard([[Markup.button.callback('Назад', `historyList=${type}`)]]).reply_markup

  return await ctx.editMessageText(text, { reply_markup: KB, parse_mode: 'MarkdownV2' })
}
