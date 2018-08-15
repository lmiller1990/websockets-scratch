const { toBin, toDec, bufferToBinary } = require("./util.js")

function getOffset(length) {
  switch (x) {
    case x < 127:
      return 0; break
    case x <= 32767:
      return 2; break
    case x > 32767:
      return 8; break
  }
}

function getPayloadLength(chunk) {
  const asBinary = toBin(chunk[1], 8)
  const payloadLength = parseInt(toDec(asBinary.slice(1, 8)))

  if (payloadLength < 126) {
    return payloadLength
  } else if (payloadLength === 126) {
    // extended length
    // Read the follow 16 bits (2 bytes)
    return parseInt(
      toDec(
        [2, 3]
          .map(x => toBin(chunk[x], 8))
          .reduce((curr, acc) => curr + acc)
      )
    )
  } else {
    return parseInt(
      toDec(
        [2, 3, 4, 5, 6, 7, 8, 9]
        .map(x => toBin(chunk[x], 8))
        .reduce((acc, curr) => acc + curr)
      )
    )
  }
}

function receiveData(chunk, payload) {
  const isLastFrame = toBin(chunk[0])[0]
  console.log(`Last Frame?: ${isLastFrame ? "true" : "false"}`)

  // Get length of the message
  const length = getPayloadLength(chunk)
  const offset = getOffset(length)
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

module.exports = {
  receiveData,
  getOffset,
  getPayloadLength
}
