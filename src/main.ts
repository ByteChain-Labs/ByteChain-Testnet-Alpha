import BCNode from "./core/node.js";
import { print } from "./utils/constants.js";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const bc_node = new BCNode();
bc_node.app.use(cors({ origin: "*" }));

const server = http.createServer(bc_node.app);
const io = new Server(server, { cors: { origin: "*" } });

bc_node.io = io;

async function main() {
  await bc_node.start();

  server.listen(3000, () => {});

  setInterval(() => {
    bc_node.pubBlock();
  }, 2000);
}

main().catch((err) => {
  console.error(`Failed to start ByteChain Node: ${err}`);
  process.exit(1);
});

process.on("SIGINT", async () => {
  print("SIGINT received, stopping node...");
  await bc_node.stop();
  process.exit(0);
});
