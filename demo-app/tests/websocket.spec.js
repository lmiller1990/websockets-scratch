const { getPayloadLength } = require("../websocket.js")
const { shortMessage, mediumMessage, longMessage } = require("./fixtures/chunks.js")
const context = describe

describe("getPayloadLength", () => {
  context("payload length is not extended length", () => {
    it("returns 120", () => {
      const actual = getPayloadLength(shortMessage())

      expect(actual).toBe(120)
    })
  })

  context("payload length is extended length", () => {
    it("returns 32767", () => {
      const actual = getPayloadLength(mediumMessage())

      expect(actual).toBe(32767)
    })
  })

  context("payload length is double extended length", () => {
    it("returns 65536", () => {
      const actual = getPayloadLength(longMessage())

      expect(actual).toBe(65536)
    })
  })
})
