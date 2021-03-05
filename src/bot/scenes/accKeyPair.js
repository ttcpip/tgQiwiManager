const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const { Scenes, Markup } = require('telegraf')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const moment = require('../../lib/moment')

const {
  escape, bold, monospace, monospaceBlock,
} = format
const wizardScene = new Scenes.BaseScene('ACC_KEY_PAIR_SCENE_ID')
const getKBCancel = (isWithConfirm = false) => {
  const rows = !isWithConfirm
    ? [['❌Отмена']]
    : [['✅Всё верно'], ['❌Отмена']]

  return Markup.keyboard(rows).oneTime().resize().reply_markup
}

const promptText = `Введите URL для создания ключей`

wizardScene.enter(async (ctx) => {
  const { qiwiAccId } = ctx.scene.session.state
  if (!qiwiAccsManager.hasById(qiwiAccId)) {
    await ctx.reply('Киви аккаунт с данным айди не найден')
    return await ctx.scene.leave()
  }

  return await ctx.reply(promptText, { reply_markup: getKBCancel() })
})

wizardScene.hears(/❌Отмена/i, async (ctx) => {
  await ctx.scene.leave()
  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})

wizardScene.hears(/✅Всё верно/i, async (ctx) => {
  const { qiwiAccId, url } = ctx.scene.session.state

  if (!url || !qiwiAccsManager.hasById(qiwiAccId))
    return await ctx.reply(`Данные устарели, попробуйте снова`, { reply_markup: getKBCancel(true) })

  const qiwi = qiwiAccsManager.getById(qiwiAccId)
  let publicKey = ''
  let secretKey = ''
  try {
    const data = await qiwi.getProtectedKeys({
      keysPairName: `Ключи на ${moment().format()}`,
      serverNotificationsUrl: url,
    })
    publicKey = `${data.publicKey}`
    secretKey = `${data.secretKey}`
  } catch (err) {
    const errMsgText = err.message || err.description || '[no error text]'
    const errInfoText = err.response && err.response.data
      ? `${errMsgText}\n${JSON.stringify(err.response.data, null, 2)}`
      : errMsgText

    return await ctx.replyWithMarkdownV2(dedent`
      Ошибка при создании ключей с киви ${bold(escape(qiwi.wallet))} ${escape(`(${qiwiAccId})`)}:
      ${monospaceBlock(errInfoText)}
    `, { reply_markup: getKBCancel() })
  }

  await ctx.replyWithMarkdownV2(dedent`
    ✅Успешно созданы ключи

    🔑Публичный ключ:
    ${monospaceBlock(publicKey)}
    🔑Приватный ключ:
    ${monospaceBlock(secretKey)}
  `)
  await ctx.replyWithMarkdownV2(`${monospaceBlock(publicKey)}`)
  await ctx.replyWithMarkdownV2(`${monospaceBlock(secretKey)}`)

  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})

wizardScene.on('text', async (ctx) => {
  const url = ctx.message.text

  if (!url)
    return await ctx.reply(`Ссылка введена неверно`)

  const { qiwiAccId } = ctx.scene.session.state
  const qiwi = qiwiAccsManager.getById(qiwiAccId)

  ctx.scene.session.state = {
    ...ctx.scene.session.state,
    url,
  }

  const text = dedent`
    ❗️ Создаем ключи с киви ${bold(escape(qiwi.wallet))} ${escape(`(${qiwiAccId})`)}
    • Ссылка: ${monospace(url)}
    ❓ Всё верно?
  `
  return await ctx.reply(text, { reply_markup: getKBCancel(true), parse_mode: 'MarkdownV2' })
})
wizardScene.use(async (ctx) => await ctx.reply(promptText, { reply_markup: getKBCancel() }))

module.exports = wizardScene
