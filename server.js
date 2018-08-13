const http = require("http")
const net = require("net")

const server = http.createServer()

server.on("upgrade", (req, socket) => {
  console.log("Upgrading to WebSocket protocol")
  socket.write(
    "HTTP/1.1 101 Web Socket protocol handshake\r\n" +
    "upgrade: websocket\r\n" +
    "connection: upgrade\r\n" +
    "\r\n"
  )

  socket.on("data", chunk => {
    console.log(chunk)
  })
})

server.listen(8000)

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

  socket.end("Message from the client")
})

request.end()
// Client and Server
// 1. Client will initiate a request to start a websocket connection
//    with "Connection: Upgrade" and "Upgrade: websocket" headers
// 2. The client should also provide Sec-WebSocket-Key and 
//    Sec_WebSocket-Version headers
//     
//    The current version of WebSockets is v13
