const dedent = require('dedent')
const { markdownv2: format } = require('telegram-format')
const settings = require('../lib/settings').getInstance()
const tgClient = require('../tgClient')

const { escape, monospaceBlock } = format

/**
 * @param {string} id
 * @param {import('../lib/Qiwi').Qiwi} qiwi
 * @param {Object} requestOptions
 * @param {Error} error
 */
module.exports = async function onQiwiApiError(id, qiwi, requestOptions, error) {
  try {
    let requestOptionsStr = ''
    try {
      requestOptionsStr = JSON.stringify(requestOptions, null, 2)
      // eslint-disable-next-line no-empty
    } catch (err) { }
    const t = escape(dedent`
      Ошибка при запросе к киви: ${error.message}
      🐤 Киви: ${qiwi.wallet} (${id})
      Параметры при запросе:
    `)
    const text = dedent`
      ${t}${monospaceBlock(requestOptionsStr)}
    `
    settings.data.tgAdminChatIds.forEach((chat) => tgClient.sendMessage(chat, text, { parse_mode: 'MarkdownV2' }).catch(() => {}))
  } catch (err) {
    console.error(`At onQiwiApiError event handler for qiwi id ${id}, wallet ${qiwi.wallet}: `)
    console.error(err)
  }
}
