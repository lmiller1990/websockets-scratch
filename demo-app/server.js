const http = require("http")
const { decodeWebSocketKey } = require("./handshake.js")
const { receiveData } = require("./websocket.js")

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

  let payload = ""
  let complete = false
  socket.on("data", chunk => {
    const { updatedPayload, complete } = receiveData(chunk, payload)
    payload = updatedPayload
    if (complete) {
      console.log(payload)
    }
    /*
    const reply = new Buffer(20)
    const replyMessage = "Hi from the server"
    reply[0] = toDec("10000001")
    reply[1] = toDec("00010010") // no mask + length
    for (let i = 0; i < replyMessage.length; i++) {
      reply[i+2] = replyMessage[i].charCodeAt(0)
    }
    socket.write(reply)*/
  })
})

server.listen(8000)

/** Demo request 
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
