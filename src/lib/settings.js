const fs = require('fs')
const writeFileAtomic = require('write-file-atomic')

class Settings {
  constructor(path) {
    this._path = path
    this._canSave = true
    /** @type {import('../../settings.json')} */
    this.data = {}

    const fileExists = fs.existsSync(path)

    if (!fileExists)
      fs.writeFileSync(path, '{}')

    this.loadFromFile()
  }

  /**
   * Returns the same instance of Settings every time
   * @param {string} path path to the settings file
   * @returns {Settings} Settings instance
   */
  static getInstance(path = './settings.json') {
    // create a unique, global symbol name
    const SETTINGS_SYMB_KEY = Symbol.for('My.App.Namespace.SETTINGS_SYMB_KEY')

    // check if the global object has this symbol
    // add it if it does not have the symbol yet
    if (!global[SETTINGS_SYMB_KEY])
      global[SETTINGS_SYMB_KEY] = new Settings(path)

    return global[SETTINGS_SYMB_KEY]
  }

  /**
   * Writes this.data to the file this._path
   */
  async save() {
    const json = JSON.stringify(this.data, null, 2)
    await writeFileAtomic(this._path, json, { encoding: 'utf8', fsync: false })
  }

  /**
   * Loads JSON data from the file this._path to this.data synchronously
   */
  loadFromFile() {
    const str = fs.readFileSync(this._path, { encoding: 'utf8' })
    const json = JSON.parse(str)
    this.data = { ...json }
  }

  /**
   * Loads JSON data from the file this._path to this.data asynchronously
   */
  async loadFromFileAsync() {
    const str = await fs.promises.readFile(this._path, { encoding: 'utf8' })
    const json = JSON.parse(str)
    this.data = { ...json }
  }
}

module.exports = Settings
