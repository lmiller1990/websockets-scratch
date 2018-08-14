const http = require("http")
const { decodeWebSocketKey } = require("./handshake.js")

const toBin = val => val.toString(2)
const toDec = val => parseInt(val, 2)

function bufferToBinary(buf) {
  let bin = ""
  for (let i = 0; i < buf.length; i++) {
    bin += toBin(buf[i]).padStart(8).replace(/\s/g, "0")
  }
  return bin
}

const server = http.createServer()

server.on("upgrade", (req, socket) => {
  console.log("Upgrading to WebSocket protocol")
  const accept = decodeWebSocketKey(req.headers["sec-websocket-key"])
  socket.write(
    "HTTP/1.1 101 Web Socket protocol handshake\r\n" +
    "upgrade: websocket\r\n" +
    "connection: upgrade\r\n" +
    "sec-websocket-accept: " + accept + "\r\n" +
    "\r\n"
  )

  socket.on("data", chunk => {
    const isLastFrame = toBin(chunk[0])[0]
    console.log(`Last Frame?: ${isLastFrame ? "true" : "false"}`)

    // Get length of the message
    const length = toDec(toBin(chunk[1]).slice(1, 8))
    console.log(`Length: ${length}`)

    // Get the mask and display it nicely
    const maskAsBin = bufferToBinary(chunk.slice(2, 6))
    const mask = chunk.slice(2, 6)
    console.log(`Mask: ${maskAsBin}`)

    // Decode the message
    const encodedMessage = chunk.slice(6, chunk.length)
    const decodedMessage = Buffer.allocUnsafe(length)
    for (let i = 0; i < length; i++) {
      console.log(i, i%4)
      console.log(mask[i % 4])
      decodedMessage[i] = encodedMessage[i] ^ mask[i % 4]
    }
    console.log("Message:", decodedMessage.toString("utf8"))
  })



})

server.listen(8000)

  /*
const request = http.request({
  host: "localhost",
  port: 8000,
  headers: {
    connection: "upgrade",
    upgrade: "websocket"
  }
})

request.on("upgrade", (res, socket) => {
  console.log("Successfully established web socket connection")

  socket.on("data", chunk => {
    console.log(chunk.toString("utf8"))
    process.exit(0)
  })

  socket.write("Message from the client")
})
request.end()
*/
// Client and Server
// 1. Client will initiate a request to start a websocket connection
//    with "Connection: Upgrade" and "Upgrade: websocket" headers
// 2. The client should also provide Sec-WebSocket-Key and 
//    Sec_WebSocket-Version headers
//     
//    The current version of WebSockets is v13
