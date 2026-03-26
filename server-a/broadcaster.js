import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3000 });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);

  ws.on("close", () => {
    clients.delete(ws);
  });
});

export function broadcast(data) {
  const message = JSON.stringify(data);

  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}