const { Telegram } = require('telegraf')
const config = require('./config')

const client = new Telegram(config.tgBotToken)

module.exports = client
