const momentTimezone = require('moment-timezone')

momentTimezone.defaultFormat = 'DD.MM.YYYY HH:ss:mm'
momentTimezone.tz('Europe/Moscow')
momentTimezone().tz('Europe/Moscow')

module.exports = momentTimezone
