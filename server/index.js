import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { PeerServer } from "peer";
import http from "http";

const app = new Hono();
const server = http.createServer();

const peerServer = PeerServer({
  port: 9000,
  path: "/myapp",
});

peerServer.on("connection", (client) => {
  console.log(`Client connected: ${client.id}`);
});

peerServer.on("disconnect", (client) => {
  console.log(`Client disconnected: ${client.id}`);
});

app.get("/", (c) => {
  return c.text("P2P Video Chat Server is running");
});

app.get("/new-user", (c) => {
  const userId = Math.random().toString(36).substr(2, 9);
  return c.json({ userId });
});

const port = 3000;
console.log(`Hono Server is running on port ${port}`);
console.log(`PeerJS Server is running on port 9000`);

serve({
  fetch: app.fetch,
  port,
});
