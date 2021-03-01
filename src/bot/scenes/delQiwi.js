const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const { Scenes, Markup } = require('telegraf')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const settings = require('../../lib/settings').getInstance()

const { escape, bold, monospace } = format
const boldEscape = (str) => bold(escape(str))
const wizardScene = new Scenes.BaseScene('DEL_QIWI_SCENE_ID')
const getKBCancel = (isWithConfirm = false) => {
  const rows = !isWithConfirm
    ? [['❌Отмена']]
    : [['✅Всё верно'], ['❌Отмена']]

  return Markup.keyboard(rows).oneTime().resize().reply_markup
}

const defaultText = `Введите примечание аккаунта для удаления`

wizardScene.enter(async (ctx) => {
  ctx.answerCbQuery().catch(() => {})
  return await ctx.reply(defaultText, { reply_markup: getKBCancel() })
})

wizardScene.hears(/❌Отмена/i, async (ctx) => {
  await ctx.scene.leave()
  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})

wizardScene.hears(/✅Всё верно/i, async (ctx) => {
  const { id } = ctx.scene.session.state

  if (!id)
    return await ctx.reply(`Данные устарели, попробуйте снова`, { reply_markup: getKBCancel(true) })

  await qiwiAccsManager.deleteByIdAndSave({ id, settings })

  await ctx.reply(`✅ Аккаунт успешно удален`, {
    reply_markup: { remove_keyboard: true },
    parse_mode: 'MarkdownV2',
  })

  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})

wizardScene.on('text', async (ctx) => {
  const id = ctx.message.text

  if (!id)
    return await ctx.reply(`Примечание введено некорректно`)

  if (!qiwiAccsManager.hasById(id))
    return await ctx.reply(`Аккаунта с таким примечанием не найдено`)

  const { wallet } = qiwiAccsManager.getById(id)

  ctx.scene.session.state = {
    ...ctx.scene.session.state,
    id,
  }

  const text = dedent`
    ❗️ Удаляем киви:
    • Номер: ${boldEscape(wallet)}
    • Примечание: ${boldEscape(id)}
    ❓ Всё верно?
  `
  return await ctx.reply(text, { reply_markup: getKBCancel(true), parse_mode: 'MarkdownV2' })
})

wizardScene.use(async (ctx) => await ctx.reply(defaultText, { reply_markup: getKBCancel() }))

module.exports = wizardScene
