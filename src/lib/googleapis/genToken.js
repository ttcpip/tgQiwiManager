const fs = require('fs')
const readline = require('readline')
const { google } = require('googleapis')
const config = require('./config')

const { SCOPES, TOKEN_PATH, CREDENTIALS_PATH } = config

async function main() {
  const credentialsStr = await fs.promises.readFile(CREDENTIALS_PATH, { encoding: 'utf8' })
  const credentials = JSON.parse(credentialsStr)
  const { client_secret, client_id, redirect_uris } = credentials.installed

  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0],
  )

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log(`Authorize this app by visiting this url:\n${authUrl}`)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err)
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err)
        console.log('Token stored to', TOKEN_PATH)
      })
    })
  })
}

main()
