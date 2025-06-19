import Account from "./accounts/account";
import BlockChain from "./core/blockchain";
import { print } from "./utils/core_constants";
const bytechain = new BlockChain();

const account1 = new Account(bytechain);
const account2 = new Account(bytechain);

bytechain.addr_bal.set(account1.blockchain_addr, 5);
bytechain.addr_bal.set(account2.blockchain_addr, 5000);


function account_tx() {
    const tx = account2.acc_sign_tx(Math.random()*10, account1.blockchain_addr);
    bytechain.add_new_tx(tx, account2.pub_key);
    print(`Transaction created: ${tx.id} from ${tx.sender} to ${tx.recipient} of amount ${tx.amount}`);

    return tx;
}


setInterval(() => {
    account_tx();
}, 180);


setInterval(() => {
    bytechain.mine_block(account1.blockchain_addr);
    print(`New block mined: Height: ${bytechain.chain.length}, Hash: ${bytechain.chain[bytechain.chain.length - 1].block_header.block_hash}`);
    //bytechain.chain[bytechain.chain.length - 1]
}, 400)
