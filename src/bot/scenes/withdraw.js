const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const { Scenes, Markup } = require('telegraf')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const { userFormatNumber } = require('../../lib/utils')
const { onWithdraw } = require('../../eventHandlers')

const { escape, bold, monospaceBlock } = format
const wizardScene = new Scenes.BaseScene('WITHDRAW_SCENE_ID')
const getKBCancel = (isWithConfirm = false) => {
  const rows = !isWithConfirm
    ? [['❌Отмена']]
    : [['✅Всё верно'], ['❌Отмена']]

  return Markup.keyboard(rows).oneTime().resize().reply_markup
}

wizardScene.enter(async (ctx) => {
  const { qiwiAccId } = ctx.scene.session.state
  if (!qiwiAccsManager.hasById(qiwiAccId)) {
    await ctx.reply('Киви аккаунт с данным айди не найден')
    return await ctx.scene.leave()
  }

  return await ctx.reply('Введите сумму и номер карты для вывода', { reply_markup: getKBCancel() })
})

wizardScene.hears(/❌Отмена/i, async (ctx) => {
  await ctx.scene.leave()
  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})

wizardScene.hears(/✅Всё верно/i, async (ctx) => {
  const { amount, qiwiAccId, card } = ctx.scene.session.state

  if (!amount || !qiwiAccId || !card || !qiwiAccsManager.hasById(qiwiAccId))
    return await ctx.reply(`Данные устарели, попробуйте снова`, { reply_markup: getKBCancel(true) })

  const qiwi = qiwiAccsManager.getById(qiwiAccId)
  try {
    await qiwi.sendRubToCard({
      amount,
      card,
    })
  } catch (err) {
    const errMsgText = err.message || err.description || '[no error text]'
    const errInfoText = err.response && err.response.data
      ? `${errMsgText}\n${JSON.stringify(err.response.data, null, 2)}`
      : errMsgText

    return await ctx.replyWithMarkdownV2(dedent`
      Ошибка при отправке ${bold(escape(amount.toString()))} руб с киви ${bold(escape(qiwi.wallet))} на карту ${bold(escape(card))}:\n${monospaceBlock(errInfoText)}
    `, { reply_markup: getKBCancel() })
  }

  onWithdraw(qiwiAccId, qiwi, { amount, card }).catch(() => {})

  let balanceErr = null
  const balance = await qiwi.getRubAccBalance().catch((err) => { balanceErr = err; return 0 })
  const balanceText = balanceErr ? `Ошибка: ${escape(balanceErr.message)}` : bold(escape(`${userFormatNumber(balance)}₽`))

  await ctx.reply(dedent`
    ✅Успешно отправлено ${bold(escape(userFormatNumber(amount)))} руб с киви ${bold(escape(qiwi.wallet))} ${escape(`(${qiwiAccId})`)} на карту ${bold(escape(card))}

    💵Текущий баланс: ${balanceText}
  `, {
    reply_markup: { remove_keyboard: true },
    parse_mode: 'MarkdownV2',
  })

  return await ctx.scene.enter('MAIN_MENU_SCENE_ID')
})

wizardScene.on('text', async (ctx) => {
  const [amountStr, card] = ctx.message.text.split(' ')
  const amount = parseFloat(amountStr)

  if (!Number.isFinite(amount))
    return await ctx.reply(`Сумма введена неверно`)
  if (!card)
    return await ctx.reply(`Номер карты введен неверно`)

  const { qiwiAccId } = ctx.scene.session.state
  const qiwi = qiwiAccsManager.getById(qiwiAccId)

  ctx.scene.session.state = {
    ...ctx.scene.session.state,
    amount,
    qiwiAccId,
    card,
  }

  const text = dedent`
    ❗️ Переводим ${bold(escape(amount.toString()))} руб с киви ${bold(escape(qiwi.wallet))} ${escape(`(${qiwiAccId})`)} на карту ${bold(escape(card))}
    ❓ Всё верно?
  `
  return await ctx.reply(text, { reply_markup: getKBCancel(true), parse_mode: 'MarkdownV2' })
})
wizardScene.use(async (ctx) => await ctx.reply('Введите сумму и номер карты для вывода', { reply_markup: getKBCancel() }))

module.exports = wizardScene
