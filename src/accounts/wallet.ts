import Transaction from "../core/transaction";
import BCNode from "../core/node";
import Account from "./account";
import { TransactionType } from "../utils/core_constants";

const bcnode = new BCNode();

class Wallet {
    account: Account;
    balance: number;

    constructor() {
        this.account = new Account();
        this.balance = bcnode.CalculateBalance();
    }

    CreateTransaction(amount: number, recipient: Account['blockchainAddress']): Transaction {
        const sender = this.account.blockchainAddress;

        if (this.balance <= 0 || amount > this.balance) {
            throw new Error('Insufficient fund to complete transaction');
        }
        if (amount < 0) {
            throw new Error('Transaction amount cannot be less than zero');
        }

        const trxType: TransactionType = { amount, sender, recipient };
        const signature = this.account.SignTransaction(trxType, this.account.privateKey);
        const transaction = new Transaction(amount, sender, recipient, signature)

        this.balance -= amount;
        return transaction;
    }
}