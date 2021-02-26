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
   * @param {Qiwi} qiwi
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
   * @param {String} id Unique id for the account
   * @returns {Qiwi}
   */
  getById(id) {
    if (!this.accs.has(id))
      throw new Error(`Account not found with id "${id}"`)

    return this.accs.get(id)
  }

  /**
   * @param {String} walletNumber Wallet number of the account
   * @returns {Qiwi}
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
   * @returns {[string, Qiwi][]} Array of [accId, accQiwiInstance]
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
