function toBin(val, padding) {
  let binary = val.toString(2)

  if (padding !== undefined) {
    return binary
      .padStart(padding)
      .replace(/\s/g, "0")
  }

  return binary
}

function toDec(val) {
  return parseInt(val, 2).toString()
}

function bufferToBinary(buf) {
  let bin = ""
  for (let i = 0; i < buf.length; i++) {
    bin += toBin(buf[i]).padStart(8).replace(/\s/g, "0")
  }
  return bin
}

module.exports = {
  toBin,
  toDec,
  bufferToBinary
}
