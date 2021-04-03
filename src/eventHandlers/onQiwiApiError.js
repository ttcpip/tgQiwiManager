const dedent = require('dedent')
const { markdownv2: format } = require('telegram-format')
const Chance = require('chance')
const externalApiClient = require('../lib/ExternalApiClient').getInstance()
const settings = require('../lib/settings').getInstance()
const tgClient = require('../tgClient')
const moment = require('../lib/moment')
const giwiAccsManager = require('../lib/QiwiAccsManager').getInstance()

const { escape, bold } = format
const chance = new Chance()

/**
 * @param {string} id
 * @param {import('../lib/Qiwi').Qiwi} qiwi
 * @param {Object} requestOptions
 * @param {Error} error
 */
module.exports = async function onQiwiApiError(id, qiwi, requestOptions, error) {
  try {
    if (!settings.data.qiwiChangingOn)
      return

    const { status, statusText } = (error?.response || {})

    const isAccBlockedError = status === 401 && statusText && statusText.includes('Unauthorized')
    const isCantSendMoneyError = status === 400 && statusText && statusText.includes('Bad Request')

    if (!isAccBlockedError && !isCantSendMoneyError)
      return console.log(`at onQiwiApiError: (!isAccBlockedError && !isCantSendMoneyError), exiting`)

    const [newQiwiToUseId, newQiwiToUse] = giwiAccsManager.getAllAccs().find(([id_, qiwi_]) => id_ !== id && id_.includes('Запасной')) || []
    if (!newQiwiToUse)
      return console.log(`at onQiwiApiError: (!newQiwiToUse), exiting`)

    const externalBotQiwi = await externalApiClient.getCurrentQiwi()
    const isExternalBotUsesErroredQiwi = qiwi.wallet === externalBotQiwi.number
    if (!isExternalBotUsesErroredQiwi)
      return console.log(`at onQiwiApiError: (!isExternalBotUsesErroredQiwi), exiting`)

    const { lastUsedQiwiDomain, qiwiDomains } = settings.data
    const lastUsedQiwiDomainIndex = qiwiDomains.indexOf(lastUsedQiwiDomain) > -1
      ? qiwiDomains.indexOf(lastUsedQiwiDomain)
      : qiwiDomains.length - 1
    const indexToUse = lastUsedQiwiDomainIndex + 1 <= qiwiDomains.length - 1
      ? lastUsedQiwiDomainIndex + 1
      : 0
    const domainToUse = qiwiDomains[indexToUse]

    if (!domainToUse)
      return console.log(`at onQiwiApiError: (!domainToUse), exiting`)

    const isNewQiwiBanned = await newQiwiToUse.isAccountBanned()
      .then(({ isBanned }) => isBanned)
      .catch(() => true)
    if (isNewQiwiBanned)
      return console.log(`at onQiwiApiError: (isNewQiwiBanned), exiting`)

    const newCallbackUrl = `/${chance.string({ length: 5, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_' })}`
    const serverNotificationsUrl = `https://${domainToUse}${newCallbackUrl}`

    await externalApiClient.updateCurrentQiwi({
      callbackUrl: newCallbackUrl,
    })
    console.log(`at onQiwiApiError: set callbackUrl via external api`)

    const { publicKey, secretKey } = await newQiwiToUse.getProtectedKeys({
      keysPairName: `Ключи на ${moment().format()}`,
      serverNotificationsUrl,
    })
    console.log(`at onQiwiApiError: created publicKey, secretKey via qiwi api`)

    settings.data.lastUsedQiwiDomain = domainToUse
    await settings.save()

    await externalApiClient.updateCurrentQiwi({
      publicKey,
      secretKey,
      number: newQiwiToUse.wallet,
    })
    console.log(`at onQiwiApiError: set publicKey, secretKey, number via external api`)

    const blockedQiwiText = bold(escape(`(${qiwi.wallet} ${id})`))
    const newQiwiText = bold(escape(`(${newQiwiToUse.wallet} ${newQiwiToUseId})`))
    const text = dedent`
      ‼️КАРАМБА КИВИ ${blockedQiwiText} ЗАБЛОКИРОВАН‼️

      ✅Новый киви ${newQiwiText}
    `
    settings.data.tgAdminChatIds.forEach((chat) => tgClient.sendMessage(chat, text, { parse_mode: 'MarkdownV2' }).catch(console.error))
  } catch (err) {
    console.error(`At onQiwiApiError event handler for qiwi id ${id}, wallet ${qiwi.wallet}: `)
    console.error(err)
  }
}
