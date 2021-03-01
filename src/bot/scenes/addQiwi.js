const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const { Scenes, Markup } = require('telegraf')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const settings = require('../../lib/settings').getInstance()
const { parseProxyStr } = require('../../lib/utils')

const { escape, bold, monospace } = format
const boldEscape = (str) => bold(escape(str))
const wizardScene = new Scenes.BaseScene('ADD_QIWI_SCENE_ID')
const getKBCancel = (isWithConfirm = false) => {
  const rows = !isWithConfirm
    ? [['❌Отмена']]
    : [['✅Всё верно'], ['❌Отмена']]

  return Markup.keyboard(rows).oneTime().resize().reply_markup
}

const promptDataText = dedent`
  Введите киви для добавления в формате:
  ${monospace(`[номер] [примечание] [токен] [прокси]`)}

  ${bold(`Номер`)} ${escape(` - без "+", с 7 в начале.`)}
  ${bold(`Прокси`)} ${escape(` - ip:порт@логин:пароль`)}
`

wizardScene.enter(async (ctx) => await ctx.replyWithMarkdownV2(promptDataText, { reply_markup: getKBCancel() }))

wizardScene.hears(/❌Отмена/i, async (ctx) => {
  await ctx.scene.leave() // чек отчистку сессии
  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})

wizardScene.hears(/✅Всё верно/i, async (ctx) => {
  const {
    wallet, id, token, ip, port, username, password,
  } = ctx.scene.session.state

  if (!wallet || !id || !token || !ip || !port || !username || !password)
    return await ctx.reply(`Данные устарели, попробуйте снова`, { reply_markup: getKBCancel(true) })

  await qiwiAccsManager.createAndSave({
    wallet, id, token, ip, port, username, password, settings,
  })

  await ctx.reply(`✅ Аккаунт успешно добавлен`, {
    reply_markup: { remove_keyboard: true },
    parse_mode: 'MarkdownV2',
  })

  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})

wizardScene.on('text', async (ctx) => {
  const [wallet, id, token, proxyStr] = ctx.message.text.split(' ')
  const {
    isOk: isValidProxy, ip, port, username, password,
  } = parseProxyStr(proxyStr)

  if (!wallet)
    return await ctx.reply(`Номер введен некорректно`)
  if (!id)
    return await ctx.reply(`Примечание введено некорректно`)
  if (!token)
    return await ctx.reply(`Токен введен некорректно`)
  if (!isValidProxy)
    return await ctx.reply(`Прокси введены некорректно`)

  if (qiwiAccsManager.hasById(id))
    return await ctx.reply(`Уже есть киви с таким примечанием`)
  if (qiwiAccsManager.hasByWalletNumber(wallet))
    return await ctx.reply(`Уже есть киви с номером`)

  ctx.scene.session.state = {
    ...ctx.scene.session.state,
    wallet,
    id,
    token,
    ip,
    port,
    username,
    password,
  }

  const text = dedent`
    ❗️ Добавляем киви:
    • Номер: ${boldEscape(wallet)}
    • Примечание: ${boldEscape(id)}
    • Токен: ${boldEscape(token)}
    • Прокси: ${boldEscape(ip)}:${boldEscape(port)}@${boldEscape(username)}:${boldEscape(password)}
    ❓ Всё верно?
  `
  return await ctx.reply(text, { reply_markup: getKBCancel(true), parse_mode: 'MarkdownV2' })
})

wizardScene.use(async (ctx) => await ctx.replyWithMarkdownV2(promptDataText, { reply_markup: getKBCancel() }))

module.exports = wizardScene
