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

The `\r\n` are required - HTTP specifies each header should be separated by a carriage return and a newline. Also, the response should end with a `\r\n`. 

Add an `upgrade` event listener to the `request` as well:

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

Let's go ahead and add a very simple message exchange, before getting started on a more substantial demo using a real browser. Update `server.on("upgrade")` to send a message using the `socket`, which is the second argument to the callback:

```js
server.on("upgrade", (req, socket) => {
  console.log("Upgrading to WebSocket protocol")
  socket.write(
    "HTTP/1.1 101 Web Socket protocol handshake\r\n" +
    "upgrade: websocket\r\n" +
    "connection: upgrade\r\n" +
    "\r\n"
  )

  socket.on("data", chunk => {
    console.log(chunk.toString("utf8"))
    socket.write("Hi, from the server!")
  })
})
```

And update teh `request.on("upgrade")` callback:

```js
request.on("upgrade", (res, socket) => {
  console.log("Successfully established web socket connection")

  socket.on("data", chunk => {
    console.log(chunk.toString("utf8"))
    process.exit(0)
  })

  socket.write("Message from the client")
})
```

Running this should now yield:

```
Upgrading to WebSocket protocol
Successfully established web socket connection
Message from the client
Hi, from the server!
```

We haven't fully implemented a WebSockets correctly yet - we are missing a crucial piece, `sec-websocket-key` and `set-websocket-accept`. The easiest and most interesting way to see the impact of this is by using a real WebSocket client implementation, such as the one that ships with any modern browser.

## Coding the Client

Creat a `index.html` with the following:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
</head>
<body>
  <script src="client.js"></script>
</body>
</html>
```

Now create `client.js` and add the following:

```js
const connection = new WebSocket("ws://localhost:8000")

connection.onmessage = evt => console.log("Message", evt)
connection.onclose = evt => console.log("Close", evt)

connection.onopen = evt => {
  console.log("Opened connection", evt)
  connection.send("Websockets are great")
}
```

All modern browsers implement WebSocket, which can be accessed using the `WebSocket` API. If you opening `index.html` and check the console. you should see:

```
client.js:1 WebSocket connection to 'ws://localhost:8000/' failed: Error during WebSocket handshake: 'Sec-WebSocket-Accept' header is missing
(anonymous) @ client.js:1
client.js:4 Close CloseEvent {isTrusted: true, wasClean: false, code: 1006, reason: "", type: "close", …}
```

This is what the WebSocket protocol specifies should happen. According to page 18 the spec (section 4.1, "Client Requirements":

> If the response lacks a |Sec-WebSocket-Accept| header field or
       the |Sec-WebSocket-Accept| contains a value other than the
       base64-encoded SHA-1 of the concatenation of the |Sec-WebSocket-
       Key| (as a string, not base64-decoded) with the string "258EAFA5-
       E914-47DA-95CA-C5AB0DC85B11" but ignoring any leading and
       trailing whitespace, the client MUST _Fail the WebSocket
       Connection_.

Since we did not implement the handshake correctly on the server, the connection fails, and closes immediately. Let's implement the handshake!

## The WebSocket Handshake

You can dig throug the spec, but [this MDN article](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers) sums up the handshake algorithm best.

1. The client sends a base64 encoded value. So, 16 random letters/numbers/symbols.
2. The server concatenates the `sec-websocket-key` and the following string: `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`. (Yes, this is really a harcoded value in the spec).
3. Next, take the SHA-1 hash of the resulting string, and return the base64 encoded value. This is the `sec-websocket-accept`, which should be sent back to the client in the response headers.

Let's implement this in another module, `handshake.js`. Here is the implementation:

```
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
```

The WebSocket spec provides an example - if the key is `dGhlIHNhbXBsZSBub25jZQ==`, the output should be `s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`. This is the case for the above, so it looks like everything it working.

Update the `server.on("update")` callback:

```js
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
    console.log(chunk.toString("utf8"))
    socket.write("Hi, from the server!")
  })
})
```

Refreshing the browser reveals a different error:

```
WebSocket connection to 'ws://localhost:8000/' failed: Invalid frame header
```

The handshake was successful, but sending data is not as simpoe as calling `socket.write("...")`. You need to follow a specific format. WebSocket connections exchange data through _data frames_. For now, remove the `socket.write` line, and replace it with `console.log(chunk)`. Now if you refresh the browser, you get `<;]H}h-+:-]:-`. Still not very useful.

## Decode the Client Data Frame

The reason that the client's message, `WebSockets are great` turns into `<;]H}h-+:-]:-` is because the WebSocket protocol requires client data to be encoded using [XOR encryption](https://en.wikipedia.org/wiki/XOR_cipher). This is pretty inconvinient. There is also a bunch of other hoops to jump through to get the data. Welcome to WebSockets, motherfucker. Data is tranferred using this complicated Data Frame format, described on [this](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#Miscellaneous) MDN page. Since the description is hard to understand, here is the gist of it:

- The first bytes, or first 8 bits, contain the following information:
  - Bit 1 (FIN): is this the final frame of data? A large websocket message can span multiple frames. 1 for final frame, 0 for not final frame.
  - Bits 2-4 (RSV1, RSV2, RSV3): Reserved for future use. Basically they do nothing now, but might be used one day, so the people who came up with WebSocket decided to reserve them.
  - Bits 5-8:  (Opcodes). This is the type of the data in the payload. 1 means text, 2 means binary. To make things even more confusing, the spec defines these using hex values, so 0x01 is text, 0x02 is binary.

## Decoding the First Byte

Let's decode the first bytes, before looking at the test of the dataframe. If we do `console.log(chunk[0])`. we get `129`. This is the decimal representation of the byte, but we want the binary representation. 

We can get it by calling `chunk[0].toString(2)`. Since this is something we will be doing a lot, I'll create a `toBin` function: `const toBin = val => val.toString(2)`. Now, if we call `console.log(toBin(chunk[0]))` we get `10000001`. Mapping this to the description above:

- FIN: 1 (last frame of the payload)
- RSV1-3: 0, 0, 0
- Opcode: 0001, or 1, which means the payload is text, which is utf8 by default

Looks correct. We will need a `toDec` function too, so add that next to `toBin`: `const toDec = val => parseInt(val, 2)`.

## Decoding the Second Byte

The second byte contains the following information:

- Bit 1 (Mask): whether the data is encoded. Client data is always encoded, so this should be 1.
- Bits 2-8 (Length): The length of the payload. Since it is 7 bits long, the maximum value is can be is 1111111, or 127. There is a built in solution to this problem. If the length is 126, the next byte will contain the rest of the data, which is the length. If the length is too large to fit into two bytes, a further two bytes are used, for a total of 4 bytes, or 32 1's - or 4294967295 characters. That should be enough for even a large amount of data (remember, WebSocket is designed for lots of small, frequent payloads).

Back to business, `toBin(chunk[1])` gives us `10010100`. The first bit, as expected, is 1. The remaining bits are 0010100, which is 20 in decimal, the length of `Websockets are great`. We should save this off for later:

```js
const length = toDec(toBin(chunk[1]).slice(1, 8)) //=> 20
```

## Decoding the Payload

Before decoding the payload, we need to masking key. Remember we said data from the client was encoding using XOR encryption? The masking key is how we decode that. The masking key is the next four bytes (32 bits), following the length. Go ahead and grab that:

`const mask = chunk.slice(2, 6)`.

If you want to display it on screen, a bit of work is needed, but it's nice to actually see what the mask looks like. Add a `bufferToBinary` function:

```js
function bufferToBinary(buf) {
  let bin = ""
  for (let i = 0; i < buf.length; i++) {
    bin += toBin(buf[i]).padStart(8).replace(/\s/g, "0")
  }
  return bin
}
```

`console.log(bufferToBinary(mask))` gives me `10011111101011110111011111111000`. This will be different every frame. The important thing to see if the mask is a 32 bit binary value.

Now we have the length of the payload, and the mask. Let's decode the payload! Since we did all the work to get the mask, decoding is relatively easy. Since the mask is 4 bytes, we do `mask[i % 4]` to XOR the message:

```js
const encodedMessage = chunk.slice(6, chunk.length)
const decodedMessage = Buffer.allocUnsafe(length)
for (let i = 0; i < length; i++) {
  decodedMessage[i] = encodedMessage[i] ^ mask[i % 4]
}
console.log("Message:", decodedMessage.toString("utf8"))
```

After decoding the message, we just change it to `utf8`, and if everything went well, `Websockets are great` is printed in the terminal.



https://en.wikipedia.org/wiki/XOR_cipher
