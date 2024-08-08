import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { ExpressPeerServer } from "peer";
import http from "http";

const app = new Hono();
const server = http.createServer();

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/myapp",
});

app.use("/peerjs", peerServer);

app.get("/", (c) => {
  return c.text("P2P Video Chat Server is running");
});

app.get("/new-user", (c) => {
  const userId = Math.random().toString(36);
  return c.json({ userId });
});

const port = 3000 || process.env.PORT;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
