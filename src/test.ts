import BlockChain from "./core/blockchain";
import Transaction from "./core/transaction";

const bytechain = new BlockChain();

const transaction = bytechain.chain[0].transactions[0];
console.log(Transaction.VerifyTrxSig(transaction, ''))

console.log()