import Account from "./accounts/account";
import BlockChain from "./core/blockchain";
import Transaction from "./core/transaction";
import { print, TxPlaceHolder } from "./utils/core_constants";

const bytechain = new BlockChain();

const account1 = new Account();
const account2 = new Account();

bytechain.addr_bal.set(account1.blockchain_addr, 200);
bytechain.addr_bal.set(account2.blockchain_addr, 10000000000);


function account1_tx() {
    const timestamp = Date.now();

    const tx1_plh: TxPlaceHolder = {
        amount: 100,
        sender: account1.blockchain_addr,
        recipient: account2.blockchain_addr,
        timestamp
    }
    
    const { signature, tx_nonce } = account1.sign_tx(tx1_plh, account1.priv_key);
    
    const tx1 = new Transaction(100, account1.blockchain_addr, account2.blockchain_addr, signature, tx_nonce, timestamp);
    
    bytechain.add_new_tx(tx1, account1.pub_key);
}


function account2_tx() {
    const timestamp = Date.now();

    const tx2_plh: TxPlaceHolder = {
        amount: 70,
        sender: account2.blockchain_addr,
        recipient: account1.blockchain_addr,
        timestamp
    }
    
    const { signature, tx_nonce } = account2.sign_tx(tx2_plh, account2.priv_key);
    
    const tx2 = new Transaction(70, account2.blockchain_addr, account1.blockchain_addr, signature, tx_nonce, timestamp);
    
    bytechain.add_new_tx(tx2, account2.pub_key);
}

//Second mining takes place.
function account1_tx2() {
    let timestamp = Date.now();

    const tx1_plh: TxPlaceHolder = {
        amount: 50,
        sender: account1.blockchain_addr,
        recipient: account2.blockchain_addr,
        timestamp
    }
    
    const { signature, tx_nonce } = account1.sign_tx(tx1_plh, account1.priv_key);
    
    const tx1 = new Transaction(50, account1.blockchain_addr, account2.blockchain_addr, signature, tx_nonce, timestamp);
    
    bytechain.add_new_tx(tx1, account1.pub_key);
    print(bytechain.tx_pool);
    
    bytechain.mine_block(account2.blockchain_addr);
    print(bytechain.chain);
}


account1_tx();
bytechain.mine_block(account2.blockchain_addr);

account2_tx();
bytechain.mine_block(account2.blockchain_addr);

account1_tx2();




setInterval(() => {
    account2_tx()

    bytechain.mine_block(account2.blockchain_addr);
    print(bytechain.chain[bytechain.chain.length - 1]);
}, 2000)


// import Account from "./accounts/account";
// import { print } from "./utils/core_constants";

// const account = new Account('6f83b7c8d9b19537c025117ee24f0f0c79edc67a2beba6bc4672af1a1c589040')

// print(account);


// function test() {
//     const date = Date.now()
//     print(date);
// }

// setInterval(() => {
//     test();
// }, 2000)