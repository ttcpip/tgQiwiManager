const { Scenes, Markup } = require('telegraf')

const wizardScene = new Scenes.BaseScene('MAIN_MENU_SCENE_ID')

wizardScene.enter(async (ctx) => {
  const { dontEdit } = ctx.scene.session.state

  const text = `⚙️ Главное меню`
  const extra = {
    reply_markup: Markup.inlineKeyboard([
      [
        Markup.button.callback('Кошельки', 'walletsList'),
        Markup.button.callback('Балансы', 'walletsBalances'),
      ],
      [
        Markup.button.callback('Прокси', '*delMsg*proxy'),
        Markup.button.callback('Статистика', 'statList'),
      ],
      [
        Markup.button.callback('Авто-вывод', 'autoWithdraw'),
        Markup.button.callback('История', 'history'),
      ],
    ]).reply_markup,
    parse_mode: 'MarkdownV2',
  }

  ctx.scene.leave()
  return await (ctx.callbackQuery && dontEdit
    ? ctx.editMessageText(text, extra)
    : ctx.reply(text, extra))
})

module.exports = wizardScene
