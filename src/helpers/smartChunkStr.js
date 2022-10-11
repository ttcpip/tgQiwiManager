function smartChunkStr(str, maxLen = 4096) {
  const DELIM = '\n'
  /** every line's length is not more than maxLen */
  const lines = str
    .split(DELIM)
    .map((line) => {
      if (line.length <= maxLen) return line
      return line.match(new RegExp(`[\\s\\S]{1,${maxLen}}`, 'g')) || ['']
    })
    .flat()
  const result = []
  let currStr = lines[0]
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const currPlusLine = currStr ? currStr + DELIM + line : line
    if (currPlusLine.length > maxLen) {
      result.push(currStr)
      currStr = line
    } else {
      currStr = currPlusLine
    }
  }
  if (currStr) result.push(currStr)

  return result
}

module.exports = { smartChunkStr }
