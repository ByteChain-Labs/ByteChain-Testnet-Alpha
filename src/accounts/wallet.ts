import Transaction from "../core/transaction";
import BCNode from "../core/node";
import Account from "./account";
// import { TCPClient } from "../network/p2p";
import { TransactionType } from "../utils/core_constants";

class Wallet {
    account: Account;
    balance: number;

    constructor() {
        this.account = new Account();
        this.balance = 0;
    }

    // UpdateBalance(): number {
    //     const address = this.account.blockchainAddress;
    //     const balance = bcnode.blockchain.GetBalance(address);

    //     return balance;
    // }

    CreateTransaction(amount: number, recipient: Account['blockchainAddress']): Transaction {
        const sender = this.account.blockchainAddress;

        if (this.balance <= 0 || amount > this.balance) {
            throw new Error('Insufficient fund to complete transaction');
        }
        // if (amount < 0) {
        //     throw new Error('Transaction amount cannot be less than zero');
        // }

        const trxType: TransactionType = { amount, sender, recipient };
        const signature = this.account.SignTransaction(trxType, this.account.privateKey);
        const transaction = new Transaction(amount, sender, recipient, signature)


        // const tcpClient = new TCPClient();

        /* tcpClient
            create a method on tcp client to allow it to connect to any tcp server(node) and send a transaction through it.
        */

        /*
            Add a way for balance calculatuon
            // this.balance = BCNode.
        */
        return transaction;
    }
}


export default Wallet;