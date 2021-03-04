const dedent = require('dedent')
const util = require('util')
const { markdownv2: format } = require('telegram-format')
const settings = require('../../lib/settings').getInstance()
const { getCircularReplacer } = require('../../lib/utils')

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
  const lines = msgText.split('\n')
  const [command, arg1, arg2, arg3] = lines[0].split(' ')

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
  if (command === '/exec' && lines.length > 1) {
    const jsCode = lines.slice(1).join('\n')
    // eslint-disable-next-line no-eval
    const output = await eval(`(async () => { ${jsCode} })()`)

    const outputType = arg1 || 'json'
    let message = null
    switch (outputType) {
    case 'json':
      message = JSON.stringify(output, getCircularReplacer(), 2)
      break

    case 'inspect':
      message = util.inspect(output, {
        showHidden: true,
        depth: 5,
      })
      break

    case 'pretty':
      message = `${output}`
      break

    default:
      break
    }
    const isJson = outputType === 'json'

    try {
      return await ctx.reply(`${message && message.length ? message : 'No output'}`)
    } catch (err) {
      const filename = `output_${Date.now()}.${isJson ? 'json' : 'txt'}`
      const source = Buffer.from(message, 'utf8')
      const caption = `Too long output`

      return await ctx.replyWithDocument({
        filename,
        source,
      }, { caption })
    }
  }

  return await next()
}
