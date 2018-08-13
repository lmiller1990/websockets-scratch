## Introduction

WebSocket is a two way communication protocol that operates over a single TCP connect. WebSocket is compatible with HTTP, and to start a WebSocket connection the WebSocket Handshake is used, which uses the HTTP Upgrade header to change from HTTP to the WebSocket protocol.

That is a lot of acronyms and terminology. Basically, WebSocket allows for a client and server to transfer data in real time with lower overheads than something like HTTP. This is useful for chat applications, games, or other programs that might want to show a real time time of sorts. To start a WebSocket session, the process goes something like this:

1. The client makes a HTTP request to a server with specific headers:
  - the `connection` header, with `upgrade` as the value. This lets the server know the client wants to move from HTTP to another protocol.
  - the `upgrade` header, with `websocket` as the value. Now the server knows that the client wants to upgrade, and to which protocol.
  - the `sec-websocket-version` and `sec-websocket-key` headers are also necessary, but more on these later.

2. The server responds. 
  - If there is a problem, such as the server does not support WebSockets, or does not support the version the client requested, the connection is closed with a 400 bad request status. This guide will not cover this situation. 
  - If ther server does support WebSockets, and it does for this purpose of this article, the server send a response with a `101 switch protocols` status, along with `upgrade: websocket` and `connection: upgrade` headers. Also the `sec-websocket-accept` header is required, more on this soon.

3. The client verifies the `set-websocket-accept` value from the server. If is it correct, then the WebSocket session is estalished! The server and client can start sending real time data using WebSockets using "data frames", which is suprisingly complicated, as you will soon see.

## Coding the Server

As with most concepts, seeing some code in context makes things a lot more approachable. We will start with a simple WebSocket server.

```js
const http = require("http")

const server = http.createServer()

server.on("upgrade", (req, socket) => {
  console.log("Upgrading to WebSocket protocol")
})

server.listen(8000)
```

This is just a basic HTTP server, waiting to upgrade. Since Node.js implements the WebSocket protocol, if the correct headers come, the `upgrade` event will trigger. We can create those headers and make a request like this:

```js
const request = http.request({
  host: "localhost",
  port: 8000,
  headers: {
    connection: "upgrade",
    upgrade: "websocket"
  }
})

request.end()
```

Now if you run `node server.js`, you should see `Upgrading to WebSocket protocol`. Now the server needs to reply to the client to let it know.

```js
server.on("upgrade", (req, socket) => {
  console.log("Upgrading to WebSocket protocol")
  socket.write(
    "HTTP/1.1 101 Web Socket protocol handshake\r\n" +
    "upgrade: websocket\r\n" +
    "connection: upgrade\r\n" +
    "\r\n"
  )
})
```

The `\r\n` are required - HTTP specifies each header should be separated by a carriage return and a newline. Also, the response should end with a `\r\n`. Add an `upgrade` event listener to the `request` as well:

```js
request.on("upgrade", (res, socket) => {
  console.log("Successfully established web socket connection")
  socket.end()
  process.exit(0)
})
```

Now you should get:

```
Upgrading to WebSocket protocol
Successfully established web socket connection
```

We haven't fully implemented a WebSockets correctly yet - we are missing a crucial piece, `sec-websocket-key` and `set-websocket-accept`. The easiest and most interesting way to see the impact of this is by using a real WebSocket client implementation, such as the one that ships with any modern browser.

## Coding the Client

Creat a `index.html` with the following:

```html
```

```js
const connection = new WebSocket("ws://localhost:8000")

connection.onmessage = evt => console.log("Message", evt)
connection.onclose = evt => console.log("Close", evt)

connection.onopen = evt => {
  console.log("Opened connection", evt)
  connection.send("Websockets are great")
}
```
