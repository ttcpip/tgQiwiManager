const MINUTE_AS_MS = 60 * 1000
const HOUR_AS_MS = 60 * MINUTE_AS_MS

module.exports = {
  tgBotToken: process.env.TG_BOT_TOKEN,
  autoWithdrawCheckBalanceIntervalMs: MINUTE_AS_MS,
  checkBannedIntervalMs: HOUR_AS_MS,
  checkQiwiRowsUpdateIntervalMs: HOUR_AS_MS,
  withdrowedAmountToNotify: 165000,
  externalApiKey: process.env.EXTERNAL_API_KEY,
  qiwiGoogleSpreadsheetId: process.env.QIWI_GOOGLE_SPREADSHEET_ID,
}
