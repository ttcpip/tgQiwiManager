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
utils.userFormatNumber = (num) => num.toLocaleString('ru-RU')

module.exports = utils
