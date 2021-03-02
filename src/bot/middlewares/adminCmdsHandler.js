const dedent = require('dedent')
const { markdownv2: format } = require('telegram-format')
const settings = require('../../lib/settings').getInstance()

const { escape, bold, monospace } = format
const boldEscape = (str) => bold(escape(str))

const helpMessageText = dedent`
  ${boldEscape('/adminList')} ${monospace('- посмотреть список админов')}
  ${boldEscape('/adminAdd [uid]')} ${monospace('- добавить админа')}
  ${boldEscape('/adminDel [uid]')} ${monospace('- удалить админа')}
`

/**
 * @param {import('telegraf').Context} ctx
 * @param {Function} next
 */
module.exports = async function adminCmdsHandler(ctx, next) {
  const msgText = ctx.message?.text || ''
  const [command, arg1, arg2, arg3] = msgText.split('\n')[0].split(' ')

  if (command === '/help')
    return await ctx.replyWithMarkdownV2(helpMessageText)
  if (command === '/adminList')
    return await ctx.reply(`Админы:\n${settings.data.tgAdminChatIds.join('\n')}`)
  if (command === '/adminAdd' && arg1) {
    const uid = parseInt(arg1, 10)
    if (!Number.isFinite(uid))
      return await ctx.reply(`Айди введено неверно`)
    if (settings.data.tgAdminChatIds.includes(uid))
      return await ctx.reply(`Он уже админ`)

    settings.data.tgAdminChatIds.push(uid)
    await settings.save()

    return await ctx.reply(`Успешно добавлен админ ${uid}`)
  }
  if (command === '/adminDel' && arg1) {
    const uid = parseInt(arg1, 10)
    if (!Number.isFinite(uid))
      return await ctx.reply(`Айди введено неверно`)
    const index = settings.data.tgAdminChatIds.indexOf(uid)
    if (index < 0)
      return await ctx.reply(`Он и так не админ`)

    settings.data.tgAdminChatIds.splice(index, 1)
    await settings.save()

    return await ctx.reply(`Успешно удален админ ${uid}`)
  }

  return await next()
}
