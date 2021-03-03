const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const { Scenes, Markup } = require('telegraf')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const settings = require('../../lib/settings').getInstance()
const { Qiwi } = require('../../lib/Qiwi')
const accAutoWithdrawHandler = require('../handlers/accAutoWithdraw')

const { escape, bold, monospace } = format
const boldEscape = (str) => bold(escape(str))
const wizardScene = new Scenes.BaseScene('CHANGE_AUTO_WITHDRAW_THRESHOLD_AND_CARD_SCENE_ID')
const getKBCancel = (isWithConfirm = false) => {
  const rows = !isWithConfirm
    ? [['❌Отмена']]
    : [['✅Всё верно'], ['❌Отмена']]

  return Markup.keyboard(rows).oneTime().resize().reply_markup
}

const getBack = async (ctx) => {
  const { qiwiAccId } = ctx.scene.session.state
  ctx.match = [null, qiwiAccId]
  return await accAutoWithdrawHandler(ctx)
}
const promptText = `❗️ Введите порог для авто-вывода и карту через пробел`

wizardScene.use(async (ctx, next) => {
  const { qiwiAccId } = ctx.scene.session.state
  if (!qiwiAccsManager.hasById(qiwiAccId)) {
    await ctx.reply('Киви аккаунт с данным айди не найден')
    return await ctx.scene.leave()
  }
  return await next()
})

wizardScene.enter(async (ctx) => {
  ctx.answerCbQuery().catch(() => {})
  return await ctx.reply(promptText, { reply_markup: getKBCancel() })
})

wizardScene.hears(/❌Отмена/i, async (ctx) => await getBack(ctx).then(() => ctx.scene.leave()))

wizardScene.on('text', async (ctx) => {
  const [thresholdToWithdrawStr, card] = ctx.message.text.split(' ')
  const thresholdToWithdraw = parseInt(thresholdToWithdrawStr, 10)

  if (!Number.isFinite(thresholdToWithdraw))
    return await ctx.reply(`Некорректно введен порог для авто-вывода.\nВведите порог для авто-вывода и карту через пробел`)
  if (!card)
    return await ctx.reply(`Некорректно введена карта для вывода.\nВведите порог для авто-вывода и карту через пробел`)

  const { qiwiAccId } = ctx.scene.session.state

  settings.data.qiwiAccs[qiwiAccId].autoWithdraw.thresholdToWithdraw = thresholdToWithdraw
  settings.data.qiwiAccs[qiwiAccId].autoWithdraw.card = card
  await settings.save()

  return await getBack(ctx)
})

wizardScene.use(async (ctx) => await ctx.reply(promptText, { reply_markup: getKBCancel() }))

module.exports = wizardScene
