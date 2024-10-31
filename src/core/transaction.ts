import crypto from 'crypto';
import { TransactionType } from "../utils/core_constants";

class Transaction {
    trxHeader: TransactionType;
    signature: string;
    readonly timestamp: number;

    constructor(amount: number, sender: string, recipient: string, signature: string) {
        this.trxHeader = { amount, sender, recipient };
        this.signature = signature;
        this.timestamp = Date.now();
    }

    HashTransaction(): Buffer {
        const trxDataAsStr = `${this.trxHeader.amount}${this.trxHeader.sender}${this.trxHeader.recipient}${this.timestamp}`;
        const hash = crypto.createHash('sha256').update(crypto.createHash('sha256').update(trxDataAsStr).digest()).digest();

        return hash;
    }

    VerifyTrxSig(publicKey: string): boolean {
        const hashedTransaction = this.HashTransaction();
        const verifier = crypto.createVerify('sha256');
        verifier.update(hashedTransaction);
        verifier.end();

        return verifier.verify(publicKey, this.signature, 'hex');
    }
}


export default Transaction;