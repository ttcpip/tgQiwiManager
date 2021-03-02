/* eslint-disable eqeqeq */
const SocksAgent = require('socks-proxy-agent')
const axiosLib = require('axios').default

function getWhatToThrow(err) {
  return err
  // return err.response
  //   ? err.response.data
  //     ? err.response.data
  //     : err.response
  //   : err
}

class Qiwi {
  /**
   * @param {Object} params
   *
   * @param {String} params.token Wallet API token
   * @param {String} params.wallet Wallet number without plus (+) and with prefix, as example: 79991234567
   *
   * @param {Object} params.proxy Proxy for requests
   * @param {String} params.proxy.host Proxy host (ip)
   * @param {String} params.proxy.port Proxy port
   * @param {String} params.proxy.userId Proxy username
   * @param {String} params.proxy.password Proxy password
   */
  constructor(params) {
    if (!params.token)
      throw new Error(`params.token is required!`)
    if (!params.wallet)
      throw new Error(`params.wallet is required!`)
    if (!params.proxy)
      throw new Error(`params.proxy is required!`)

    this.token = params.token
    this.wallet = params.wallet
    this.apiUri = 'https://edge.qiwi.com'

    this.headers = {
      Accept: 'application/json',
      'content-type': 'application/json',
      Authorization: 'Bearer ' + this.token,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
    }

    this.setProxy({ type: 5, ...params.proxy })

    /**
     * Currency codes
     */
    this.currencyCode = {
      RUB: 643,
      USD: 840,
      EUR: 978,
      KZT: 398,
    }

    /**
     * Allowable recepients
     */
    this.recipients = {
      banks: {
        alfabank: { id: 464, accountType: 1 },
        tinkoff: { id: 466, accountType: 1 },
        ao_otp_bank: { id: 804, accountType: 1 },
        ao_rosselhozbank: { id: 810, accountType: 5 },
        russkiy_standard: { id: 815, accountType: 1 },
        pao_vtb: { id: 816, accountType: 5 },
        promsvyazbank: { id: 821, accountType: 7 },
        pao_sberbank: { id: 870, accountType: 5 },
        renessans_credit: { id: 881, accountType: 1 },
        moskovskiy_kreditniy_bank: { id: 1134, accountType: 5 },
      },
      cards: {
        visa_sng: 1960,
        visa_rus: 1963,
        mastercard_sng: 21012,
        mastercard_rus: 21013,
        mir: 31652,
      },
      differentServices: {
        onlime: 674,
        podari_jizn: 1239,
      },
      qiwi: 99,
    }

    /**
     * Transaction type
     */
    this.txnType = {
      IN: 0,
      OUT: 1,
      ALL: 2,
    }

    /**
     * Format of receipt file
     */
    this.receiptFormat = {
      Jpeg: 'JPEG',
      Pdf: 'PDF',
    }
  }

  // #region Top level methods
  async getRubAccBalance() {
    const { accounts } = await this.getAccounts()

    const rubAcc = accounts.find((acc) => acc.currency === this.currencyCode.RUB)
    if (!rubAcc)
      throw new Error(`No rub account found`)

    const rubs = parseFloat(rubAcc.balance.amount)
    return rubs
  }

  // eslint-disable-next-line class-methods-use-this
  async sendRubToCard({ amount, card }) {
    // const err = new Error(`Err from sendRubToCard`)
    // err.response = {
    //   data: {
    //     dataErr: 'aspdasd',
    //     dataSmth: ['dasd', 111, 22335],
    //   },
    // }
    // throw err
    console.log(`Mocking call to this.toCard with params: `)
    console.log({ amount, account: card })

    return {
      mockAmount: amount,
      mockAccount: card,
      mockComment: '',
    }
    // return await this.toCard({
    //   amount,
    //   account: card,
    //   comment: '',
    // })
  }

  /**
   * @param {{operation:string, sources:string, startDate:Date, endDate:Date}} params
   * @returns {{ incoming: {[currency: string]: number}, outgoing: {[currency: string]: number}}}
   */
  async getStatistics(params) {
    const data = await this.getOperationStatistics(params)
    const { incomingTotal, outgoingTotal } = data

    const result = {
      incoming: {},
      outgoing: {},
    }

    for (const { amount, currency } of incomingTotal)
      result.incoming[currency] = amount
    for (const { amount, currency } of outgoingTotal)
      result.outgoing[currency] = amount

    return result
  }
  // #endregion

  // #region Raw qiwi api methods
  /**
   * Get identification data
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#ident_data
   */
  getIdentificationData() {
    const options = {
      url: `${this.apiUri}/identification/v1/persons/${this.wallet}/identification`,
    }

    return this.get(options)
  }

  /**
   * Identify wallet
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#ident
   * @param {{birthDate:string, firstName:string, middleName:string, lastName:string, passport:string, inn:string, snils:string, oms:string}} requestOptions
   */
  identifyWallet(requestOptions) {
    const options = {
      url: `${this.apiUri}/identification/v1/persons/${this.wallet}/identification`,
      body: requestOptions,
    }

    return this.post(options)
  }

  /**
   * Get accounts of wallet
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#balances_list
   */
  getAccounts() {
    const options = {
      url: `${this.apiUri}/funding-sources/v2/persons/${this.wallet}/accounts`,
    }

    return this.get(options)
  }

  /**
   * Creates new account by alias
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#balance_create
   * @param {string} accountAlias Alias of account name
   */
  createAccount(accountAlias) {
    const options = {
      url: `${this.apiUri}/funding-sources/v2/persons/${this.wallet}/accounts`,
      body: {
        alias: accountAlias,
      },
    }

    return this.post(options)
  }

  /**
   * Sets default account
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#default_balance
   * @param {string} accountAlias Alias of account name
   */
  setDefaultAccount(accountAlias) {
    const options = {
      url: `${this.apiUri}/funding-sources/v2/persons/${this.wallet}/accounts/${accountAlias}`,
      headers: this.headers,
      body: {
        defaultAccount: true,
      },
      json: true,
    }

    return this.patch(options)
  }

  /**
   * Get possible aliases of account
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#funding_offer
   */
  getPossibleAccountAliases() {
    const options = {
      url: `${this.apiUri}/funding-sources/v2/persons/${this.wallet}/accounts/offer`,
    }

    return this.get(options)
  }

  /**
   * Get information about current account
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#profile
   */
  getAccountInfo() {
    const options = {
      url: `${this.apiUri}/person-profile/v1/profile/current`,
    }

    return this.get(options)
  }

  /**
   * Get operation history
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#payments_list
   * @param {{rows:number, operation:string, sources:string, startDate:Date, endDate:Date, nextTxnDate:Date, nextTxnId:number}} requestOptions
   */
  getOperationHistory(requestOptions) {
    const options = {
      url: `${this.apiUri}/payment-history/v2/persons/${this.wallet}/payments`,
      params: requestOptions,
    }

    return this.get(options)
  }

  /**
   * Get statistics for operations
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#stat
   * @param {{operation:string, sources:string, startDate:Date, endDate:Date}} requestOptions
   */
  getOperationStatistics(requestOptions) {
    const options = {
      url: `${this.apiUri}/payment-history/v2/persons/${this.wallet}/payments/total`,
      params: requestOptions,
    }

    return this.get(options)
  }

  /**
   * Get information about transaction
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#txn_info
   * @param {string} transactionId Transaction Id
   * @param {string} type Transaction type. Possible values: null, IN, OUT (type from ationHistory)
   */
  getTransactionInfo(transactionId) {
    const options = {
      url: `${this.apiUri}/payment-history/v2/transactions/${transactionId}`,
    }

    return this.get(options)
  }

  /**
   * Get receipt by transaction
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#payment_receipt
   * @param {string} transactionId Transaction Id
   * @param {{type:string, format:string}} requestOptions
   */
  getReceipt(transactionId, requestOptions) {
    const options = {
      url: `${this.apiUri}/payment-history/v1/transactions/${transactionId}/cheque/file`,
      params: requestOptions,
    }

    return this.get(options)
  }

  /**
   * Send to qiwi wallet
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#p2p
   * @param {{amount:number, comment:string, account:string}} requestOptions
   */
  toWallet(requestOptions) {
    const options = {
      url: `${this.apiUri}/sinap/terms/99/payments`,
      body: {
        id: (1000 * Date.now()).toString(),
        sum: {
          amount: requestOptions.amount,
          currency: '643',
        },
        source: 'account_643',
        paymentMethod: {
          type: 'Account',
          accountId: '643',
        },
        comment: requestOptions.comment,
        fields: {
          account: requestOptions.account,
        },
      },
    }

    return this.post(options)
  }

  /**
   * Send to mobile phone
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#cell
   * @param {{amount:number, comment:string, account:string}} requestOptions
   */
  async toMobilePhone(requestOptions) {
    try {
      const operator = await this.detectOperator(`7${requestOptions.account}`)
      const options = {
        url: `${this.apiUri}/sinap/terms/${operator.message}/payments`,
        body: {
          id: (1000 * Date.now()).toString(),
          sum: {
            amount: requestOptions.amount,
            currency: '643',
          },
          source: 'account_643',
          paymentMethod: {
            type: 'Account',
            accountId: '643',
          },
          comment: requestOptions.comment,
          fields: {
            account: requestOptions.account,
          },
        },
      }

      return this.post(options)
    } catch (error) {
      throw getWhatToThrow(error)
    }
  }

  /**
   * Send to card
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#cards
   * @param {{amount:number, comment:string, account:string}} requestOptions
   */
  async toCard(requestOptions) {
    try {
      const card = await this.detectCard(requestOptions.account)
      const options = {
        url: `${this.apiUri}/sinap/terms/${card.message}/payments`,
        body: {
          id: (1000 * Date.now()).toString(),
          sum: {
            amount: requestOptions.amount,
            currency: '643',
          },
          source: 'account_643',
          paymentMethod: {
            type: 'Account',
            accountId: '643',
          },
          comment: requestOptions.comment,
          fields: {
            account: requestOptions.account,
          },
        },
      }

      return this.post(options)
    } catch (error) {
      throw getWhatToThrow(error)
    }
  }

  /**
   * Send to bank account
   * @param {{amount:number,account:string,account_type:number,exp_date:number}} requestOptions
   * @param {number} recipient
   */
  toBank(requestOptions, recipient) {
    const options = {
      url: `${this.apiUri}/sinap/terms/${recipient}/payments`,
      body: {
        id: (1000 * Date.now()).toString(),
        sum: {
          amount: requestOptions.amount,
          currency: '643',
        },
        source: 'account_643',
        paymentMethod: {
          type: 'Account',
          accountId: '643',
        },
        comment: requestOptions.comment,
        fields: {
          account: requestOptions.account,
          account_type: requestOptions.account_type,
          exp_date: requestOptions.exp_date,
        },
      },
    }

    return this.post(options)
  }

  /**
   * Send to other service.
   * @param {{providerId:string|number, amount:number, account:string}} requestOptions
   */
  toOther(requestOptions) {
    const options = {
      url: `${this.apiUri}/sinap/terms/${requestOptions.providerId}/payments`,
      body: {
        id: (1000 * Date.now()).toString(),
        sum: {
          amount: requestOptions.amount,
          currency: '643',
        },
        source: 'account_643',
        paymentMethod: {
          type: 'Account',
          accountId: '643',
        },
        fields: {
          account: requestOptions.account,
        },
      },
    }

    return this.post(options)
  }

  /**
   * Pay by requisites, only commercial receivers
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#freepay
   * @param {{account: string, amount:number, bankName:string, bik:string, city: string, organizationName: string, inn:string, kpp:string, nds:string, purpose: string, urgent:number, senderName:string, senderMiddleName: string, senderLastName:string }} requestOptions
   */
  toRequisites(requestOptions) {
    const options = {
      url: `${this.apiUri}/sinap/api/v2/terms/1717/payments`,
      body: {
        id: (1000 * Date.now()).toString(),
        sum: {
          amount: requestOptions.amount,
          currency: '643',
        },
        paymentMethod: {
          type: 'Account',
          accountId: '643',
        },
        fields: {
          account: requestOptions.account,
          name: requestOptions.bankName,
          extra_to_bik: requestOptions.bik,
          to_bik: requestOptions.bik,
          city: requestOptions.city,
          info: 'Коммерческие организации',
          is_comercial: 1,
          to_name: requestOptions.organizationName,
          to_inn: requestOptions.inn,
          to_kpp: requestOptions.kpp,
          nds: requestOptions.nds,
          goal: requestOptions.purpose,
          urgent: requestOptions.urgent,
          from_name: requestOptions.senderName,
          from_name_p: requestOptions.senderMiddleName,
          from_name_f: requestOptions.senderLastName,
          requestProtocol: 'qw1',
          toServiceId: '1717',
        },
      },
    }

    return this.post(options)
  }

  /**
   * Get information about commission
   * @param {number} recipient receiver identifier, see this.recipients
   */
  checkCommission(recipient) {
    const options = {
      url: `${this.apiUri}/sinap/providers/${recipient}/form`,
    }

    return this.get(options)
  }

  /**
   * Check commission rates
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#rates
   * @param {number} recipient receiver identifier, see this.recipients
   * @param {{account:string, amount: number}} requestOptions options
   */
  checkOnlineCommission(recipient, requestOptions) {
    const options = {
      url: `${this.apiUri}/sinap/providers/${recipient}/onlineCommission`,
      body: {
        account: requestOptions.account,
        paymentMethod: {
          type: 'Account',
          accountId: '643',
        },
        purchaseTotals: {
          total: {
            amount: requestOptions.amount,
            currency: '643',
          },
        },
      },
    }

    return this.post(options)
  }

  /**
   * Get cross rates
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#section-1
   */
  getCrossRates() {
    const options = {
      url: `${this.apiUri}/sinap/crossRates`,
    }

    return this.get(options)
  }

  /**
   * Convert currency at wallet
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#CCY
   * @param {{amount:number, currency:string, account:string}} requestOptions
   * account - number of your wallet, example: '+79991234567'
   */
  convertCurrency(requestOptions) {
    const options = {
      url: `${this.apiUri}/sinap/api/v2/terms/99/payments`,
      body: {
        id: (1000 * Date.now()).toString(),
        sum: {
          amount: requestOptions.amount,
          currency: requestOptions.currency,
        },
        paymentMethod: {
          type: 'Account',
          accountId: '643',
        },
        comment: requestOptions.comment,
        fields: {
          account: requestOptions.account,
        },
      },
    }

    return this.post(options)
  }

  /**
   * Add webhook by url
   * @param {string} url Url address
   * @param {number} txnType type of messages. 0 - "In", 1 - "Out". 2 - "All", see this.txnType
   */
  addWebHook(url, txnType) {
    const options = {
      url: `${this.apiUri}/payment-notifier/v1/hooks`,
      params: {
        hookType: 1,
        param: url,
        txnType,
      },
    }

    return this.put(options)
  }

  /**
   * Remove webhook by UUID
   * @param {string} hookId webhook UUID
   */
  removeWebHook(hookId) {
    const options = {
      url: `${this.apiUri}/payment-notifier/v1/hooks/${hookId}`,
    }

    return this.del(options)
  }

  /**
   * Get webhook secret key by UUID
   * @param {string} hookId webhook UUID
   */
  getWebHookSecret(hookId) {
    const options = {
      url: `${this.apiUri}/payment-notifier/v1/hooks/${hookId}/key`,
    }

    return this.get(options)
  }

  /**
   * Refresh webhook secret key by UUID
   * @param {string} hookId webhook UUID
   */
  getNewWebHookSecret(hookId) {
    const options = {
      url: `${this.apiUri}/payment-notifier/v1/hooks/${hookId}/newkey`,
    }

    return this.post(options)
  }

  /**
   * Get information about active webhook for this wallet(token)
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#hook_active
   * @param {function(err,data)}
   */
  getActiveWebHook() {
    const options = {
      url: `${this.apiUri}/payment-notifier/v1/hooks/active`,
    }

    return this.get(options)
  }

  /**
   * Sends test request to active webhook
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#hook_test
   */
  testActiveWebHook() {
    const options = {
      url: `${this.apiUri}/payment-notifier/v1/hooks/test`,
    }

    return this.get(options)
  }

  /**
   * Get invoices
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#list_invoice
   * @param {{rows:number,nextId:number,nextDate:Date,from:Date,to:Date}} requestOptions
   */
  getInvoices(requestOptions) {
    const options = {
      url: `${this.apiUri}/checkout/api/bill/search`,
      params: {
        statuses: 'READY_FOR_PAY',
        rows: requestOptions.rows,
        min_creation_datetime: requestOptions.from == null ? null : requestOptions.from.getTime(),
        max_creation_datetime: requestOptions.to == null ? null : requestOptions.to.getTime(),
        next_id: requestOptions.nextId,
        next_creation_datetime: requestOptions.nextDate == null ? null : requestOptions.nextDate.getTime(),
      },
    }

    return this.get(options)
  }

  /**
   * Pay invoice
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#paywallet_invoice
   * @param {string} invoiceId Invoice id from getInvoices (bills[].id)
   * @param {string} currency Currency from getInvoices (bills[].sum.currency)
   */
  payInvoice(invoiceId, currency) {
    const options = {
      url: `${this.apiUri}/checkout/invoice/pay/wallet`,
      body: {
        invoice_uid: invoiceId,
        currency,
      },
    }

    return this.post(options)
  }

  /**
   * Cancel invoice
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#cancel_invoice
   * @param {number} invoiceId Invoice id from getInvoices
   */
  cancelInvoice(invoiceId) {
    const options = {
      url: `${this.apiUri}/checkout/api/bill/reject`,
      body: {
        id: invoiceId,
      },
    }

    return this.post(options)
  }
  // #endregion

  // #region Utils for methods
  /**
   * Detects operator of phone number
   * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#cell
   * @param {string} phone phone number
   */
  async detectOperator(phone) {
    const options = {
      url: 'https://qiwi.com/mobile/detect.action',
      params: {
        phone,
      },
    }

    const errorMessage = 'Can\'t detect operator'
    try {
      const result = await this.post(options)
      if (result.code.value == '2')
        throw new Error(errorMessage)
      return result
    } catch (error) {
      if (error.message != undefined && error.message == errorMessage)
        throw getWhatToThrow(error)

      throw getWhatToThrow(error)
    }
  }

  /**
   * Detects card type
   * @param {string} cardNumber card number
   */
  async detectCard(cardNumber) {
    const options = {
      url: 'https://qiwi.com/card/detect.action',
      params: {
        cardNumber,
      },
    }

    const errorMessage = 'Wrong card number'
    try {
      const result = await this.post(options)
      if (result.code.value == '2')
        throw new Error(errorMessage)
      return result
    } catch (error) {
      if (error.message != undefined && error.message == errorMessage)
        throw getWhatToThrow(error)

      throw getWhatToThrow(error)
    }
  }
  // #endregion

  // #region Request functions
  setProxy(proxy) {
    this.axios = axiosLib.create({
      httpAgent: new SocksAgent(proxy),
      httpsAgent: new SocksAgent(proxy),
      headers: this.headers,
    })
  }

  /**
   * Execute get request
   * @param {{url:string,params:*}} options
   */
  async get(options) {
    try {
      const result = await this.axios.get(options.url, options)
      if (result.data.errorCode != undefined)
        throw result.data

      return result.data
    } catch (error) {
      throw getWhatToThrow(error)
    }
  }

  /**
   * Execute post request
   * @param {{url:string,body:*}} options
   */
  async post(options) {
    try {
      const result = await this.axios.post(options.url, options.body, options)
      if (result.data.errorCode != undefined)
        throw result.data

      return result.data
    } catch (error) {
      throw getWhatToThrow(error)
    }
  }

  /**
   * Execute patch request
   * @param {{url:string,body:*}} options
   */
  async patch(options) {
    try {
      const result = await this.axios.patch(options.url, options.body, options)
      if (result.data.errorCode != undefined)
        throw result.data

      return result.data
    } catch (error) {
      throw getWhatToThrow(error)
    }
  }

  /**
   * Execute put request
   * @param {{url:string,body:*}} options
   */
  async put(options) {
    try {
      const result = await this.axios.put(options.url, options.params, options)
      if (result.data.errorCode != undefined)
        throw result.data

      return result.data
    } catch (error) {
      throw getWhatToThrow(error)
    }
  }

  /**
   * Execute delete request
   * @param {{url:string,body:*}} options
   */
  async del(options) {
    try {
      const result = await this.axios.delete(options.url, options)
      if (result.data.errorCode != undefined)
        throw result.data

      return result.data
    } catch (error) {
      throw getWhatToThrow(error)
    }
  }
  // #endregion
}

module.exports = { Qiwi }
