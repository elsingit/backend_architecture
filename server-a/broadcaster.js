//NOTE TO SELF: check other options beside creating a HTTP server
import { createServer } from "http";
import { WebSocketServer } from "ws";

// Create an HTTP server so nginx can proxy_pass and upgrade to WS
const server = createServer((req, res) => {
  res.writeHead(200);
  res.end("Server A OK");
});

const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[Server A] Client connected. Total: ${clients.size}`);
  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[Server A] Client disconnected. Total: ${clients.size}`);
  });
  ws.on("error", (err) => {
  console.error("[Server A] WebSocket error:", err.message);
  clients.delete(ws);
});
});

server.listen(3000, () => {
  console.log("[Server A] HTTP+WS server listening on port 3000");
});

export function broadcast(data) {
  const message = JSON.stringify(data);

  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}