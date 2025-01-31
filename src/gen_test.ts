// import Transaction from "./core/transaction";
// import BlockChain from "./core/blockchain";
// import Account from "./accounts/account";
// import { TxPlaceHolder, print } from "./utils/core_constants";

// const bc = new BlockChain();

// const user1 = new Account();
// const user2 = new Account();


// bc.addr_bal.set(user1.blockchain_addr, 500);


// print("User 1: ", bc.addr_bal.get(user1.blockchain_addr))
// print("User 2: ", bc.addr_bal.get(user2.blockchain_addr))


// // A transaction for user1 -> user2
// const tx1_ph: TxPlaceHolder = { 
//     amount: 300, 
//     sender: user1.blockchain_addr, 
//     recipient: user2.blockchain_addr,
//     comment: "This is a test tx."
// }

// const tx1  = new Transaction(
//     300, 
//     user1.blockchain_addr, 
//     user2.blockchain_addr, 
//     user1.sign_tx(tx1_ph, user1.priv_key),
//     "This is a test tx."
// );

// bc.add_new_tx(tx1, user1.pub_key);

// print(tx1)
// print(bc.chain)

// bc.mine_block(user2.blockchain_addr);

// print("User 1: ", bc.addr_bal.get(user1.blockchain_addr))
// print("User 2: ", bc.addr_bal.get(user2.blockchain_addr))



// // A transaction for user2 -> user1
// const tx2_ph: TxPlaceHolder = { 
//     amount: 24, 
//     sender: user2.blockchain_addr, 
//     recipient: user1.blockchain_addr 
// }

// const tx2  = new Transaction(
//     24, 
//     user2.blockchain_addr, 
//     user1.blockchain_addr, 
//     user2.sign_tx(tx2_ph, user2.priv_key),
//     "This is a test tx."
// );

// bc.add_new_tx(tx2, user2.pub_key);

// print(tx2)
// print(bc.chain)

// bc.mine_block(user2.blockchain_addr);

// print("User 1: ", bc.addr_bal.get(user1.blockchain_addr))
// print("User 2: ", bc.addr_bal.get(user2.blockchain_addr))

// print(bc.chain)


import create_peer from "./network/p2p";
import { print } from "./utils/core_constants";

create_peer().catch(err => {
    print("Error creating peer");
})