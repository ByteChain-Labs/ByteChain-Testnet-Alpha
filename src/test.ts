import Wallet from "./accounts/wallet";

const wallet = new Wallet();
console.log(wallet.balance)

//Testing wallet class
wallet.CreateTransaction(10, 'AlexJohn');

console.log(wallet.balance)
