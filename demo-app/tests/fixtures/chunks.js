const { toBin, toDec } = require("../../util.js")

module.exports.shortMessage = () => {
  return Uint8Array.from([
    0x00, // not relevant
    0x78  // 120
  ])
}

/**
 * length > 127 but less than 65535
 */
module.exports.mediumMessage = () => {
  // length is 32767, or 0111 1111 1111 1111
  return Uint8Array.from([
    0x00, // not relevant
    0x7e, // 126 -> indicate extended payload
    0x7f, // 0111 1111
    0xff  // 1111 1111 
  ])
}

/**
 * length > 32767
 * Extended Extended Payload
 */
module.exports.longMessage = () => {
  // length is 65536, or 0001 0000 0000 0000
  return Uint8Array.from([
    0x00, // not relevant
    0x7f, // 127 -> indicated double extended
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x01, // 000  0001
    0x00, // 0000 0000
    0x00  // 0000 0000
  ])
}
