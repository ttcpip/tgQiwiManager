const { google } = require('googleapis')
const credentials = require('./credentials.json')
const token = require('./token.json')

const { client_secret, client_id, redirect_uris } = credentials.installed
const oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris[0],
)
oAuth2Client.setCredentials(token)

const sheets = google.sheets({ version: 'v4', auth: oAuth2Client })

module.exports = { sheets }

// sheets.spreadsheets.values.batchUpdate({
//   spreadsheetId: '1wfFpovjaseVPamRt8n1Pa5qSnaHKHEGh9D3YF2Xehus',
//   requestBody: {
//     valueInputOption: 'USER_ENTERED', // RAW
//     data: [
//       {
//         range: 'A20:A23',
//         majorDimension: 'ROWS',
//         values: [
//           ['Прокси'],
//           ['Лимит'],
//           ['Бан'],
//           ['Ворк'],
//         ],
//       },
//     ],
//   },
// }, (err, res) => {
//   if (err)
//     return console.error('The API returned an error: ', err)

//   console.log(res.data)
// })

// ---------------------------

// sheets.spreadsheets.values.get({
//   spreadsheetId: '1wfFpovjaseVPamRt8n1Pa5qSnaHKHEGh9D3YF2Xehus',
//   range: 'A6:G10',
// }, (err, res) => {
//   if (err)
//     return console.error('The API returned an error: ', err)
//   const rows = res.data.values
//   if (rows.length) {
//     console.log('Name, Major:')
//     // Print columns A and E, which correspond to indices 0 and 4.
//     rows.map((row) => console.log(row.join(', ')))
//   } else {
//     console.log('No data found.')
//   }
// })
