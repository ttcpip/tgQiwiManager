const momentTimezone = require('moment-timezone')

momentTimezone.defaultFormat = 'MM.DD.YYYY HH:ss:mm'
momentTimezone.tz = 'Europe/Moscow'

module.exports = momentTimezone
