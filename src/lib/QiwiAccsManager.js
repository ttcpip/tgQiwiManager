const { Qiwi } = require('./Qiwi')

class QiwiAccsManager {
  constructor() {
    this.accs = new Map()
    this.walletNumbers = new Map()
  }

  /**
   * Returns the same instance of QiwiAccsManager every time
   * @returns {QiwiAccsManager} QiwiAccsManager instance
   */
  static getInstance() {
    const INSTANCE_SYMB_KEY = Symbol.for('My.App.Namespace.QiwiAccsManager_SYMB_KEY')

    if (!global[INSTANCE_SYMB_KEY])
      global[INSTANCE_SYMB_KEY] = new QiwiAccsManager()

    return global[INSTANCE_SYMB_KEY]
  }

  /**
   * @param {String} id Unique id for the account
   * @param {import('./Qiwi').Qiwi} qiwi
   */
  add(id, qiwi) {
    if (this.accs.has(id))
      throw new Error(`Already have account with id "${id}"`)
    if (this.walletNumbers.has(qiwi.wallet))
      throw new Error(`Already have account with wallet number "${qiwi.wallet}"`)

    this.accs.set(id, qiwi)
    this.walletNumbers.set(qiwi.wallet, id)
  }

  /**
   * Creates Qiwi instance, adds this to qiwiAccsManager.accs, saves to settings.data.qiwiAccs[id]
   * @param {Object} params
   * @param {String} params.wallet
   * @param {String} params.id
   * @param {String} params.token
   * @param {String} params.ip
   * @param {String} params.port
   * @param {String} params.username
   * @param {String} params.password
   * @param {import('./settings')} params.settings
   * @returns {Promise<Qiwi>} created Qiwi instance
   */
  async createAndSave(params) {
    const {
      wallet, id, token, ip, port, username, password, settings,
    } = params

    const qiwiData = {
      token,
      proxy: {
        host: ip,
        port,
        userId: username,
        password,
      },
      wallet,
    }
    const qiwi = new Qiwi(qiwiData)
    this.add(id, qiwi)
    settings.data.qiwiAccs[id] = qiwiData
    await settings.save()

    return qiwi
  }

  /**
   * Sets proxy to the Qiwi instance, edits and saves at settings.data.qiwiAccs[id]
   * @param {Object} params
   * @param {String} params.id
   * @param {Object} params.proxy
   * @param {String} params.proxy.ip
   * @param {String} params.proxy.port
   * @param {String} params.proxy.username
   * @param {String} params.proxy.password
   * @param {import('./settings')} params.settings
   */
  async setProxyAndSave(params) {
    const {
      id,
      proxy: {
        ip, password, port, username,
      },
      settings,
    } = params

    const proxy = {
      host: ip,
      port,
      userId: username,
      password,
    }
    const qiwi = this.getById(id)
    qiwi.setProxy(proxy)

    if (settings.data.qiwiAccs[id]) {
      settings.data.qiwiAccs[id].proxy = proxy
      await settings.save()
    }
  }

  /**
   * Deletes from qiwiAccsManager.accs and to settings.data.qiwiAccs[id], saves settings
   * @param {Object} params
   * @param {String} params.id
   * @param {import('./settings')} params.settings
   */
  async deleteByIdAndSave(params) {
    const { id, settings } = params

    this.deleteById(id)
    delete settings.data.qiwiAccs[id]
    await settings.save()
  }

  /**
   * @param {String} id Unique id for the account
   * @returns {boolean}
   */
  hasById(id) {
    return this.accs.has(id)
  }

  /**
   * @param {String} walletNumber Wallet number of the account
   * @returns {boolean}
   */
  hasByWalletNumber(walletNumber) {
    return this.walletNumbers.has(walletNumber)
  }

  /**
   * @param {String} id Unique id for the account
   * @returns {import('./Qiwi').Qiwi}
   */
  getById(id) {
    if (!this.accs.has(id))
      throw new Error(`Account not found with id "${id}"`)

    return this.accs.get(id)
  }

  /**
   * @param {String} walletNumber Wallet number of the account
   * @returns {import('./Qiwi').Qiwi}
   */
  getByWalletNumber(walletNumber) {
    if (!this.walletNumbers.has(walletNumber))
      throw new Error(`Account not found with wallet number "${walletNumber}"`)

    const id = this.walletNumbers.get(walletNumber)
    return this.accs.get(id)
  }

  /**
   * @param {String} id Unique id for the account
   */
  deleteById(id) {
    if (!this.accs.has(id))
      throw new Error(`Account not found with id "${id}"`)

    this.walletNumbers.delete(this.accs.get(id).wallet)
    this.accs.delete(id)
  }

  /**
   * @param {String} walletNumber Wallet number of the account
   */
  deleteByWalletNumber(walletNumber) {
    if (!this.walletNumbers.has(walletNumber))
      throw new Error(`Account not found with wallet number "${walletNumber}"`)

    const id = this.walletNumbers.get(walletNumber)
    this.accs.delete(id)
    this.walletNumbers.delete(walletNumber)
  }

  /**
   * @returns {[string, import('./Qiwi').Qiwi][]} Array of [accId, accQiwiInstance]
   */
  getAllAccs() {
    return [...this.accs.entries()]
  }

  /**
   * @returns {{ [id: string]: { balance: 0, err: null }}}
   */
  async getAllBalances() {
    const accs = this.getAllAccs()
    const result = {}
    for (const [id, qiwi] of accs)
      result[id] = { balance: 0, err: null }

    await Promise.all(accs.map(async ([id, qiwi]) => {
      try {
        const balance = await qiwi.getRubAccBalance()
        result[id].balance = balance
      } catch (err) {
        result[id].err = err
      }
    }))

    return result
  }
}

module.exports = QiwiAccsManager
