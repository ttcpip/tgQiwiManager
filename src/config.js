const MINUTE_AS_SECONDS = 60 * 1000

module.exports = {
  tgBotToken: process.env.TG_BOT_TOKEN,
  autoWithdrawCheckBalanceIntervalMs: MINUTE_AS_SECONDS,
}
