import BCNode from "./core/node.js";
import { print } from "./utils/constants.js";


const bc_node = new BCNode();

async function main() {
    await bc_node.start();

    setInterval(() => {
        bc_node.pubBlock()
    }, 2000);
}

main().catch(err => {
    console.error(`Failed to start ByteChain Node: ${err}`)
    process.exit(1);
});


process.on('SIGINT', async () => {
    print('SIGINT received, stopping node...');
    await bc_node.stop();
    process.exit(0);
});
