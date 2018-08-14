const { toBin, toDec, bufferToBinary } = require("../util.js")

describe("toBin", () => {
  it("returns 10 as a binary", () => {
    const actual = toBin(10)
    expect(actual).toBe("1010")
  })

  it("returns 10 as a binary with padding", () => {
    const actual = toBin(10, 8)
    expect(actual).toBe("00001010")
  })
})

describe("toDec", () => {
  it("returns 11 in base ten", () => {
    const actual = toDec("00001010")
    expect(actual).toBe("10")
  })
})

describe("bufferToBinary", () => {
  it("converts a buffer to a binary string", () => {
    const buffer = Buffer.allocUnsafe(2)
    buffer[0] = 1 // 00000001
    buffer[1] = 2 // 00000010

    const actual = bufferToBinary(buffer)
    expect(actual).toBe("0000000100000010")
  })
})
