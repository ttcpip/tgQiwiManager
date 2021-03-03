const { Markup } = require('telegraf')
const { markdownv2: format } = require('telegram-format')
const dedent = require('dedent')
const qiwiAccsManager = require('../../lib/QiwiAccsManager').getInstance()
const settings = require('../../lib/settings').getInstance()

const { escape, bold, monospace } = format
const boldEscape = (str) => bold(escape(str))

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function onOffAutoWithdrawHandler(ctx) {
  const [_, id] = ctx.match

  if (!qiwiAccsManager.hasById(id))
    return await ctx.answerCbQuery(`Аккаунт с таким айди не найден`)

  settings.data.qiwiAccs[id].autoWithdraw.on = !settings.data.qiwiAccs[id].autoWithdraw.on
  await settings.save()

  return require('./accAutoWithdraw')(ctx)
}
