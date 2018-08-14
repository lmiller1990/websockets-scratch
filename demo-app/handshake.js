const crypto = require("crypto")

const magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

function decodeWebSocketKey(key) {
  // use sha1
  const sha1 = crypto.createHash("sha1")
  // append key and magic value
  const valueToHash = key + magic

  // hash the value
  sha1.update(valueToHash)
  
  // get the result in base64 format
  return sha1.digest("base64")
}

module.exports = { decodeWebSocketKey }


