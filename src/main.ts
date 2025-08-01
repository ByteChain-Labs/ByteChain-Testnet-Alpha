import BCNode from "./core/node.js";
import { print } from "./utils/core_constants.js";

const node_port = parseInt(process.env.PORT || '4001');

const bc_node = new BCNode(node_port, 3001);

async function main() {
    await bc_node.start();

    setInterval(() => {
        bc_node.pubBlock()
    }, 5000);
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


// const account1 = new Account(bytechain);
// const account2 = new Account(bytechain);

// bytechain.addr_bal.set(account1.blockchain_addr, 5);
// bytechain.addr_bal.set(account2.blockchain_addr, 5000000000000);

// // This is the bytecode format for a language called gyro
// const bc = `
// {
//   "bytecode": [
//     1, 0,
//     80,
//     52,
//     33, 0,
//     0,
//     52,
//     82
//   ],
//   "constantPool": [
//     "Hello, Gyro Hacker"
//   ]
// }
// `;

// function account_tx() {
//     const tx_byte = account2.acc_sign_byte_tx(Math.random()*10, account1.blockchain_addr);
//     bytechain.add_new_tx(tx_byte);
// }

// function account_tx_contract() {
//     const tx_contract = account2.acc_sign_contract(bc)
//     bytechain.add_new_tx(tx_contract);
//     return tx_contract.contract_addr ?? '';
// }

// function account_tx_contract_call(c_addr: string) {
//     const tx_contract = account2.acc_sign_contract_call(c_addr)
//     bytechain.add_new_tx(tx_contract);
// }

// const c_addr = account_tx_contract();

// setInterval(() => {
//     account_tx();
// }, 1000);

// setInterval(() => {
//     account_tx_contract_call(c_addr);
// }, 5000);


// setInterval(() => {
//     bytechain.mine_block(account1.blockchain_addr);
//     const { block_header, transactions } = bytechain.chain[bytechain.chain.length - 1];
//     print(`New block mined: Height: ${block_header.block_height}, Hash: ${block_header.block_hash}(${transactions.length} tx)`);
// }, 2000)
