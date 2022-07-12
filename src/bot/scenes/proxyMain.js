const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const { Scenes, Markup } = require('telegraf')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const settings = require('../../lib/settings').getInstance()
const { parseProxyStr, formatProxyObj } = require('../../lib/utils')
const { Qiwi } = require('../../lib/Qiwi')
const { updateQiwiRow } = require('../../lib/googleapis/updateQiwiRow')

const { escape, bold, monospaceBlock } = format
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
]).reply_markup

const promptProxyText = `Введите прокси в формате: ${escape(`ip:порт@логин:пароль`)}`

const sceneMainMenuHandler = async (ctx) => {
  const {
    ip, port, username, password,
  } = ctx.scene.session.state

  if (!ip || !port || !username || !password)
    return await ctx.reply(`Данные устарели, попробуйте снова`, { reply_markup: getKBCancel() })

  const text = dedent`
    ❗️ Прокси: ${boldEscape(ip)}:${boldEscape(port)}@${boldEscape(username)}:${boldEscape(password)}
    ❓ Что делаем с ними?
  `
  return ctx.callbackQuery
    ? await ctx.editMessageText(text, { reply_markup: getMainKb(), parse_mode: 'MarkdownV2' })
    : await ctx.replyWithMarkdownV2(text, { reply_markup: getMainKb(), parse_mode: 'MarkdownV2' })
}

wizardScene.enter(async (ctx) => {
  const proxiesText = qiwiAccsManager.getAllAccs()
    .map(([id, {
      wallet, proxy: {
        host, port, userId, password,
      },
    }]) => `${wallet} (${id}) ${host}:${port}@${userId}:${password}`)
    .join('\n')

  await ctx.replyWithMarkdownV2(`${escape('Текущие прокси:')}\n${monospaceBlock(proxiesText)}`)
  return await ctx.replyWithMarkdownV2(promptProxyText, { reply_markup: getKBCancel() })
})

wizardScene.hears(/❌Отмена/i, async (ctx) => {
  await ctx.scene.leave()
  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})

wizardScene.on('text', async (ctx) => {
  const proxyStr = ctx.message.text
  const {
    isOk: isValidProxy, ip, port, username, password,
  } = parseProxyStr(proxyStr)

  if (!isValidProxy)
    return await ctx.reply(`Невалидно введены прокси`, { reply_markup: getKBCancel() })

  ctx.scene.session.state = {
    ...ctx.scene.session.state,
    ip,
    port,
    username,
    password,
  }

  return await sceneMainMenuHandler(ctx)
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

  const extra = {
    reply_to_message_id: ctx.callbackQuery.message?.message_id,
    allow_sending_without_reply: true,
    reply_markup: getKBCancel(),
  }
  try {
    ctx.answerCbQuery('⏳Отправка запроса...').catch(() => {})
    await qiwi.get({ url: 'https://google.com' })
    return await ctx.reply(`✅Ответ получен`, extra)
  } catch (err) {
    return await ctx.reply(`❌Ответ не был получен: ${err.message || err.description || '[no err message]'}`, extra)
  }
})

wizardScene.action('setForAcc', async (ctx) => {
  const rows = qiwiAccsManager
    .getAllAccs()
    .map(([id]) => [Markup.button.callback(id, `setForAcc=${id}`)])
  rows.push([Markup.button.callback('Назад', 'toSceneMainMenu')])

  const KB = Markup.inlineKeyboard(rows).reply_markup

  return await ctx.editMessageText(`Для какого аккаунта?`, { reply_markup: KB })
})

wizardScene.action(/setForAcc=(.+)/, async (ctx) => {
  const {
    ip, port, username, password,
  } = ctx.scene.session.state

  if (!ip || !port || !username || !password)
    return await ctx.reply(`Данные устарели, попробуйте снова`, { reply_markup: getKBCancel() })

  const id = ctx.match[1]

  if (!qiwiAccsManager.hasById(id))
    return await ctx.answerCbQuery(`Не найден аккаунт киви с таким айди`, { show_alert: true })
  const qiwi = qiwiAccsManager.getById(id)

  await qiwiAccsManager.setProxyAndSave({
    id,
    settings,
    proxy: {
      ip,
      port,
      username,
      password,
    },
  })
  const obj = {
    apiToken: qiwi.token,
    walletNumber: qiwi.wallet,
    password: id,
    proxy: formatProxyObj({
      ip, port, username, password,
    }),
  }
  updateQiwiRow(obj).catch((err) => console.error(`Err at updateQiwiRow():`, obj, err))

  return await ctx.answerCbQuery(`✅Прокси установлены для аккаунта ${id}`, { show_alert: true })
})

wizardScene.action('toSceneMainMenu', sceneMainMenuHandler)

wizardScene.use(async (ctx) => await ctx.replyWithMarkdownV2(promptProxyText, { reply_markup: getKBCancel() }))

module.exports = wizardScene
