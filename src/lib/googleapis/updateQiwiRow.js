const moment = require('../moment')
const { sheets } = require('.')
const config = require('../../config')

const qiwiRowStatuses = {
  work: 'Ворк',
  ban: 'Бан',
  limit: 'Лимит',
  proxy: 'Прокси',
}
const mapObj = {
  status: 'B',
  walletNumber: 'C',
  password: 'D',
  apiToken: 'E',
  proxy: 'F',
  balance: 'G',
  income: 'H',
  costs: 'I',
  lastErr: 'K',
}
const absoluteRowsOffset = 5
const qiwiRowsTableRange = 'A6:I'

/** @param {QiwiRowFields} fields */
async function updateQiwiRow(fields) {
  // find existing row with the given wallet
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: config.qiwiGoogleSpreadsheetId,
    range: qiwiRowsTableRange,
  })

  const relativeRowIndex = resp.data.values.findIndex((el) => el[2] === fields.walletNumber)
  const absoluteRowNumber = absoluteRowsOffset + relativeRowIndex + 1
  if (relativeRowIndex <= -1) {
    console.log(`relativeRowIndex <= -1 at updateQiwiRow(), fields.walletNumber=${fields.walletNumber}`)
    return
  }

  const data = Object.keys(fields)
    .filter((fieldName) => mapObj[fieldName])
    .map((fieldName) => ({
      range: `${mapObj[fieldName]}${absoluteRowNumber}`,
      majorDimension: 'ROWS',
      values: [
        [fields[fieldName]],
      ],
    }))

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: config.qiwiGoogleSpreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED', // USER_ENTERED or RAW
      data,
    },
  })
  console.log(`updateQiwiRow() done:`, fields)
}

/** @param {QiwiRowFields} fields */
async function createQiwiRow(fields) {
  // find existing row with the given wallet
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: config.qiwiGoogleSpreadsheetId,
    range: qiwiRowsTableRange,
  })

  const relativeRowIndex = resp.data.values
    .findIndex(
      (el) => [...el].splice(1, Object.keys(mapObj).length).every((el_) => !el_),
    )
  const absoluteRowNumber = absoluteRowsOffset + relativeRowIndex + 1
  if (relativeRowIndex <= -1) {
    console.log(`relativeRowIndex <= -1 at updateQiwiRow(), fields.walletNumber=${fields.walletNumber}`)
    return
  }

  const data = Object.keys(fields)
    .filter((fieldName) => mapObj[fieldName])
    .map((fieldName) => ({
      range: `${mapObj[fieldName]}${absoluteRowNumber}`,
      majorDimension: 'ROWS',
      values: [
        [fields[fieldName]],
      ],
    }))

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: config.qiwiGoogleSpreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED', // USER_ENTERED or RAW
      data,
    },
  })
  console.log(`createQiwiRow() done: `, fields)
}

/** @param {string} walletNumber */
async function deleteQiwiRow(walletNumber) {
  // find existing row with the given wallet
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: config.qiwiGoogleSpreadsheetId,
    range: qiwiRowsTableRange,
  })

  const relativeRowIndex = resp.data.values.findIndex((el) => el[2] === walletNumber)
  const absoluteRowNumber = absoluteRowsOffset + relativeRowIndex + 1
  if (relativeRowIndex <= -1) {
    console.log(`relativeRowIndex <= -1 at deleteQiwiRow(), walletNumber=${walletNumber}`)
    return
  }

  const data = Object.keys(mapObj)
    .map((fieldName) => ({
      range: `${mapObj[fieldName]}${absoluteRowNumber}`,
      majorDimension: 'ROWS',
      values: [['']],
    }))

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: config.qiwiGoogleSpreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED', // USER_ENTERED or RAW
      data,
    },
  })
  console.log(`deleteQiwiRow() done: `, { walletNumber })
}

/** @param {Error} err */
function getNewQiwiRowStatusByErr(err) {
  const m = (err?.message || '').toLowerCase()
  if (m.includes('proxy') || m.includes('socks5'))
    return qiwiRowStatuses.proxy
  return qiwiRowStatuses.ban
}

/** @param {Error} err */
function buildLastErrField(err) {
  return `${moment().tz('Europe/Moscow').format('DD.MM.YYYY HH:mm')} — ${(err?.message || '')}`
}

module.exports = {
  updateQiwiRow,
  createQiwiRow,
  deleteQiwiRow,
  qiwiRowStatuses,

  getNewQiwiRowStatusByErr,
  buildLastErrField,
}

/**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {Object} QiwiRowFields
 * @property {string} QiwiRowUpdateFields.status
 * @property {string} QiwiRowUpdateFields.walletNumber
 * @property {string} QiwiRowUpdateFields.password
 * @property {string} QiwiRowUpdateFields.apiToken
 * @property {string} QiwiRowUpdateFields.proxy
 * @property {number} QiwiRowUpdateFields.balance
 * @property {number} QiwiRowUpdateFields.income
 * @property {number} QiwiRowUpdateFields.costs
 * @property {string} QiwiRowUpdateFields.lastErr
 */
