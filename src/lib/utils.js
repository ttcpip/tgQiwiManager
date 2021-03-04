const utils = {}

/**
 * @param {string} str ip:port@username:password
 */
utils.parseProxyStr = (_str) => {
  const str = typeof _str === 'string' ? _str : ''

  const [ipPort, usernamePassword] = str.split('@')

  const [ip, port] = (ipPort || '').split(':')
  const [username, password] = (usernamePassword || '').split(':')

  return {
    isOk: ip && port && username && password,
    ip,
    port,
    username,
    password,
  }
}

/**
 * @param {Number} num
 */
utils.userFormatNumber = (num) => {
  if (typeof num !== 'number')
    return '0'
  return num.toLocaleString('ru-RU', {
    maximumFractionDigits: 2,
  })
}

/**
 * @returns {Function} Replacer for JSON.stringify to handle circular stuctures
 */
utils.getCircularReplacer = () => {
  const seen = new WeakSet()

  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value))
        return '[circular]'
      seen.add(value)
    }
    return value
  }
}

module.exports = utils
