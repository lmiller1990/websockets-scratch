const connection = new WebSocket("ws://localhost:8000")

connection.onmessage = evt => console.log("Message", evt)
connection.onclose = evt => console.log("Close", evt)

connection.onopen = evt => {
  console.log("Opened connection", evt)
  connection.send(
    "AAAA" 
  )

  setTimeout(() => {
    connection.send(
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" 
    )
  }, 100)
}
