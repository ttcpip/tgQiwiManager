const { google } = require('googleapis')
const writeFile = require('write-file-atomic')
const fs = require('fs')
const credentials = require('./credentials.json')
const token = require('./token.json')

const { client_secret, client_id, redirect_uris } = credentials.installed
const oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris[0],
)
oAuth2Client.setCredentials({ access_token: 'd82005bf23133cce283ef08069d8ff31a90ece82' })

const sheets = google.sheets({ version: 'v4', auth: oAuth2Client })

const TOKEN_FILE_PATH = './src/lib/googleapis/token.json'
async function checkRefreshToken() {
  try {
    const token = JSON.parse(await fs.promises.readFile(TOKEN_FILE_PATH, 'utf8'))
    if (!token.expiry_date) throw new Error(`!token.expiry_date`)
    if (token.expiry_date > Date.now()) return

    const { credentials: newToken } = await oAuth2Client.refreshAccessToken()
    if (!newToken) throw new Error(`!newToken`)
    await writeFile(TOKEN_FILE_PATH, JSON.stringify(newToken, null, 2))
  } catch (err) {
    console.error(`When updating googleapis access_token:`, err)
  }
}
setInterval(checkRefreshToken, 1 * 60 * 1000)

module.exports = { sheets }
