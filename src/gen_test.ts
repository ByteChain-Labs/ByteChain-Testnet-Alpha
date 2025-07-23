import Account from "./accounts/account.js";
import BlockChain from "./core/blockchain.js";
import { print } from "./utils/core_constants.js";


const bytechain = new BlockChain();


const account1 = new Account(bytechain);
const account2 = new Account(bytechain);

bytechain.addr_bal.set(account1.blockchain_addr, 5);
bytechain.addr_bal.set(account2.blockchain_addr, 5000000000000);

// This is the bytecode format for a language called gyro
const bytecode = `
{
  "bytecode": [
    1, 0,
    80,
    52,
    33, 0,
    0,
    52,
    82
  ],
  "constantPool": [
    "Hello, Gyro Hacker \nHappy Hacking"
  ]
}
`;

function account_tx() {
    const tx_byte = account2.acc_sign_byte_tx(Math.random()*10, account1.blockchain_addr);
    bytechain.add_new_tx(tx_byte);
}

function account_tx_contract() {
    const tx_contract = account2.acc_sign_contract(bytecode)
    bytechain.add_new_tx(tx_contract);
}


setInterval(() => {
    account_tx();
    account_tx_contract();
}, 1000);


setInterval(() => {
    bytechain.mine_block(account1.blockchain_addr);
    const { block_header, transactions } = bytechain.chain[bytechain.chain.length - 1];
    print(`New block mined: Height: ${block_header.block_height}, Hash: ${block_header.block_hash}(${transactions.length} tx)`);
}, 2000)
