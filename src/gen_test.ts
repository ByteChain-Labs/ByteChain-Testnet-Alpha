import Account from "./accounts/account";
import BlockChain from "./core/blockchain";
import Transaction from "./core/transaction";
import { print, TxPlaceHolder } from "./utils/core_constants";

const bytechain = new BlockChain();

const account1 = new Account();
const account2 = new Account();

bytechain.addr_bal.set(account1.blockchain_addr, 1024);
bytechain.addr_bal.set(account2.blockchain_addr, 4096);


function account_tx() {
    const tx_plh: TxPlaceHolder = {
        amount: 10,
        sender: account2.blockchain_addr,
        recipient: account1.blockchain_addr,
    }
    
    const { signature, tx_nonce } = account2.sign_tx(tx_plh);
    
    const tx = new Transaction(
        tx_plh.amount,
        tx_plh.sender,
        tx_plh.recipient,
        signature,
        tx_nonce,
    );
    
    bytechain.add_new_tx(tx, account2.pub_key);

    return tx;
}


setInterval(() => {
    account_tx();
}, 1000);


setInterval(() => {
    bytechain.mine_block(account2.blockchain_addr);
    print(bytechain.chain[bytechain.chain.length - 1]);
}, 2000)
