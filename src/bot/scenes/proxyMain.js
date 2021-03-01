const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const { Scenes, Markup } = require('telegraf')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const { parseProxyStr } = require('../../lib/utils')
const { Qiwi } = require('../../lib/Qiwi')

const { escape, bold, monospace } = format
const boldEscape = (str) => bold(escape(str))
const wizardScene = new Scenes.BaseScene('PROXY_MAIN_SCENE_ID')
const getKBCancel = (isWithConfirm = false) => {
  const rows = !isWithConfirm
    ? [['❌Отмена']]
    : [['✅Всё верно'], ['❌Отмена']]

  return Markup.keyboard(rows).oneTime().resize().reply_markup
}
const getMainKb = () => Markup.inlineKeyboard([
  [Markup.button.callback('Проверить валидность', 'checkValid')],
  [Markup.button.callback('Установить для аккаунта', 'setForAcc')],
  [Markup.button.callback('❌Отмена', 'cancel')],
]).reply_markup

const promptProxyText = `Введите прокси в формате: ${escape(`ip:порт@логин:пароль`)}`

wizardScene.enter(async (ctx) => await ctx.replyWithMarkdownV2(promptProxyText, { reply_markup: getKBCancel() }))

wizardScene.hears(/❌Отмена/i, async (ctx) => {
  await ctx.scene.leave()
  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})
wizardScene.action('cancel', async (ctx) => {
  await ctx.scene.leave()
  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})

wizardScene.on('text', async (ctx) => {
  const proxyStr = ctx.message.text
  const {
    isOk: isValidProxy, ip, port, username, password,
  } = parseProxyStr(proxyStr)

  if (!isValidProxy)
    return await ctx.reply(`Невалидно введены прокси`)

  ctx.scene.session.state = {
    ...ctx.scene.session.state,
    ip,
    port,
    username,
    password,
  }

  const text = dedent`
    ❗️ Прокси: ${boldEscape(ip)}:${boldEscape(port)}@${boldEscape(username)}:${boldEscape(password)}
    ❓ Что делаем с ними?
  `
  return await ctx.replyWithMarkdownV2(text, { reply_markup: getMainKb() })
})

wizardScene.action('checkValid', async (ctx) => {
  const {
    ip, port, username, password,
  } = ctx.scene.session.state

  if (!ip || !port || !username || !password)
    return await ctx.reply(`Данные устарели, попробуйте снова`, { reply_markup: getKBCancel() })

  const qiwi = new Qiwi({
    token: '1',
    wallet: '2',
    proxy: {
      host: ip,
      port,
      userId: username,
      password,
    },
  })

  const extra = { reply_to_message_id: ctx.callbackQuery.message?.message_id, allow_sending_without_reply: true }
  try {
    ctx.answerCbQuery('⏳Отправка запроса...').catch(() => {})
    await qiwi.get({ url: 'https://google.com' })
    return await ctx.reply(`✅Ответ получен`, extra)
  } catch (err) {
    return await ctx.reply(`❌Ответ не был получен: ${err.message || err.description || '[no err message]'}`, extra)
  }
})

wizardScene.action('setForAcc', async (ctx) => {
  // TODO
})

wizardScene.use(async (ctx) => await ctx.replyWithMarkdownV2(promptProxyText, { reply_markup: getKBCancel() }))

module.exports = wizardScene
