class TaskLoop {
  /**
   * @param {{
   *  intervalMs: number,
   *  taskFn: (),
   *  onTaskErrorCallback: (err: Error)
   * }} params
   */
  constructor(params) {
    if (!params.onTaskErrorCallback)
      params.onTaskErrorCallback = (err) => console.error(`Error when doing task: `, err)
    this.params = params
  }

  async start() {
    const startTime = Date.now()

    await this.doTask()

    const endTime = Date.now()
    const timeToWait = this.params.intervalMs - (endTime - startTime)
    setTimeout(this.start.bind(this), timeToWait)
  }

  async doTask() {
    try {
      await this.params.taskFn()
    } catch (err) {
      this.params.onTaskErrorCallback(err)
    }
  }
}

module.exports = TaskLoop
