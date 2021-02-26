const { Context, Markup } = require('telegraf')
const { markdownv2: format } = require('telegram-format')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()

/**
 * @param {Context} ctx
 * @param {Function} next
 */
module.exports = async function mainMenuHandler(ctx) {
  const text = `⚙️ Главное меню`
  const extra = {
    reply_markup: Markup.inlineKeyboard([
      [
        Markup.button.callback('Кошельки', 'walletsList'),
        Markup.button.callback('Балансы', 'walletsBalances'),
      ],
      [
        Markup.button.callback('Прокси', 'proxy'),
        Markup.button.callback('Статистика', 'stats'),
      ],
      [
        Markup.button.callback('Авто-вывод', 'autoWithdraw'),
        Markup.button.callback('История', 'history'),
      ],
    ]).reply_markup,
    parse_mode: 'MarkdownV2',
  }

  return ctx.callbackQuery
    ? ctx.editMessageText(text, extra)
    : ctx.reply(text, extra)
}
