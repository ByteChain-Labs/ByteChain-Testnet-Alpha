import BCNode from "./core/node.js";
import { BLOCK_TIME, print } from "./utils/constants.js";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const bc_node = new BCNode();
bc_node.app.use(cors({ origin: "*" }));

const server = http.createServer(bc_node.app);
const io = new Server(server, { cors: { origin: "*" } });

bc_node.io = io;

async function main() {
    await bc_node.start(server);

    setTimeout(() => {
        setInterval(() => {
            bc_node.pub_block();
        }, BLOCK_TIME);
    }, 15_000);
}

main().catch((err: any) => {
    console.error(`Failed to start ByteChain Node: ${err}`);
    process.exit(1);
});

process.on("SIGINT", async () => {
    print("SIGINT received, stopping node...");
    await bc_node.stop();
    process.exit(0);
});