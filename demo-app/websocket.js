const { toBin, toDec, bufferToBinary } = require("./util.js")

function getExtendedPayloadLength(chunk) {
  const extendedLength = chunk.slice(2, 4)
  return toDec(bufferToBinary(extendedLength))
}

function getReallyExtendedPayloadLength(chunk) {
  throw "TODO: Implement for 65kb+ payload"
  return toDec(bufferToBinary(extendedLength))
}

function receiveData(chunk, payload) {
  const isLastFrame = toBin(chunk[0])[0]
  console.log(`Last Frame?: ${isLastFrame ? "true" : "false"}`)

  // Get length of the message
  let length = parseInt(toDec(toBin(chunk[1]).slice(1, 8)))
  let isLong = false

  if (length === 126) {
    length = getExtendedPayloadLength(chunk)
    isLong = true
  } else if (length === 127) {
    length = getReallyExtendedPayloadLength(chunk)
  }

  let extra = isLong ? 2 : 0
  console.log(`Length: ${length}`)
  // Get the mask and display it nicely
  const maskAsBin = bufferToBinary(chunk.slice(2 + extra, 6 + extra))
  const mask = chunk.slice(2 + extra, 6 + extra)
  console.log(`Mask: ${maskAsBin}`)

  // Decode the message
  const encodedMessage = chunk.slice(6 + extra, chunk.length)
  const decodedMessage = Buffer.allocUnsafe(parseInt(length))
  for (let i = 0; i < length; i++) {
    decodedMessage[i] = encodedMessage[i] ^ mask[i % 4]
  }

  return {
    updatedPayload: payload + decodedMessage.toString("utf8"),
    complete: isLastFrame
  }
}

module.exports = { receiveData }
