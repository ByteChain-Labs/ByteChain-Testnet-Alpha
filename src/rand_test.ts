import Transaction from "./core/transaction";
import BlockChain from "./core/blockchain";
import Account from "./accounts/account";
import { TxPlaceHolder } from "./utils/core_constants";

const bc = new BlockChain();

const print = (...data: any): void => {
    console.log(...data);
}

const user1 = new Account();
const user2 = new Account();


bc.addr_bal.set(user1.blockchain_addr, 500);

const user1_bal = bc.addr_bal.get(user1.blockchain_addr);
const user2_bal = bc.addr_bal.get(user2.blockchain_addr);

print("User 1: ", user1_bal)

const tx1_ph: TxPlaceHolder = { 
    amount: 300, 
    sender: user1.blockchain_addr, 
    recipient: user2.blockchain_addr 
}

const tx1  = new Transaction(
    300, 
    user1.blockchain_addr, 
    user2.blockchain_addr, 
    user1.sign_tx(tx1_ph, user1.priv_key),
    "This is a test tx."
);

print(tx1)

bc.add_new_tx(tx1, user1.pub_key);
bc.mine_block(user2.blockchain_addr);

print("User 1: ", user1_bal)
print("User 2: ", user2_bal)








// const tx2_ph: TxPlaceHolder = { 
//     amount: 300, 
//     sender: user2.blockchain_addr, 
//     recipient: user1.blockchain_addr 
// }

// const tx2  = new Transaction(
//     300, 
//     user2.blockchain_addr, 
//     user1.blockchain_addr, 
//     user2.sign_tx(tx2_ph, user2.priv_key),
//     "This is a test tx."
// );

// print(tx2)

// bc.add_new_tx(tx2, user2.pub_key);
// bc.mine_block(user2.blockchain_addr);

// print("User 1: ", user1_bal)
// print("User 2: ", user2_bal)