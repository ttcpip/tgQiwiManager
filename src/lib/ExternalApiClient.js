const axios = require('axios').default

class ExternalApiClient {
  /**
   * @param {Object} params
   * @param {string} params.apiKey
   * @param {string=} params.apiBaseUrl
   */
  constructor(params) {
    this.params = {
      apiBaseUrl: 'http://localhost:4456/secret_api/',
      ...params,
    }
    this.axios = axios.create({
      timeout: 30000,
      baseURL: this.params.apiBaseUrl,
      params: {
        apiKey: this.params.apiKey,
      },
    })
  }

  /**
   * @param {Object} params
   * @param {string} params.apiKey
   * @param {string=} params.apiBaseUrl
   * @returns {ExternalApiClient}
   */
  static getInstance(params) {
    const INSTANCE_SYMB_KEY = Symbol.for('My.App.Namespace.ExternalApiClient_SYMB_KEY')

    if (!global[INSTANCE_SYMB_KEY])
      global[INSTANCE_SYMB_KEY] = new ExternalApiClient(params)

    return global[INSTANCE_SYMB_KEY]
  }

  /**
   * @param {import('axios').Method} method
   * @param {string} url
   * @param {import('axios').AxiosRequestConfig} opts
   * @returns {{ data: any }}
   */
  async apiRequest(method, url, opts) {
    const { data: answerBody } = await this.axios.request({
      method,
      url,
      ...opts,
    })

    if (!(answerBody && answerBody.data))
      throw new Error(`Api error: ${answerBody.error}`)

    return answerBody
  }

  /**
   * @returns {{ name: string, number: string, callbackUrl: string }}
   */
  async getCurrentQiwi() {
    const { data: { currentQiwi } } = await this.apiRequest('GET', '/getCurrentQiwi')
    return currentQiwi
  }

  /**
   * @param {{ name: string?, number: string?, callbackUrl?: string, publicKey?: string, secretKey?: string }} updatingData
   * @returns {{ name: string, number: string, callbackUrl: string }}
   */
  async updateCurrentQiwi(updatingData) {
    const opts = {
      data: {
        updatingData,
      },
    }
    const { data: { currentQiwi } } = await this.apiRequest('PUT', '/updateCurrentQiwi', opts)
    return currentQiwi
  }
}

module.exports = ExternalApiClient
