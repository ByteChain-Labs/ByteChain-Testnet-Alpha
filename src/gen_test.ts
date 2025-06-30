import Account from "./accounts/account.js";
import BlockChain from "./core/blockchain.js";
import { print } from "./utils/core_constants.js";


const bytechain = new BlockChain();

const account1 = new Account(bytechain);
const account2 = new Account(bytechain);

bytechain.addr_bal.set(account1.blockchain_addr, 5);
bytechain.addr_bal.set(account2.blockchain_addr, 5000000000000);


function account_tx() {
    const tx = account2.acc_sign_tx(Math.random()*10, account1.blockchain_addr);
    bytechain.add_new_tx(tx);
}


setInterval(() => {
    account_tx();
}, Math.random()*300);


setInterval(() => {
    bytechain.mine_block(account1.blockchain_addr);
    const { block_header, transactions } = bytechain.chain[bytechain.chain.length - 1];
    
    print(`New block mined: Height: ${block_header.block_height}, Hash: ${block_header.block_hash}(${transactions.length} tx)`);
}, Math.random()*1500)