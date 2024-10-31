import crypto from 'crypto';
import { TransactionType } from '../utils/core_constants';
import { HashTransaction } from '../utils/crypto';

class Transaction {
    trxHeader: TransactionType;
    signature: string;
    readonly timestamp: number;

    constructor(amount: number, sender: string, recipient: string, signature: string) {
        this.trxHeader = { amount, sender, recipient };
        this.signature = signature;
        this.timestamp = Date.now();
    }

    VerifyTrxSig(publicKey: string): boolean {
        const trxDataAsStr: string = `${this.trxHeader.amount}${this.trxHeader.sender}${this.trxHeader.recipient}${this.timestamp}`;
        const hashedTransaction = HashTransaction(trxDataAsStr);
        const verifier = crypto.createVerify('SHA256');
        verifier.update(hashedTransaction);
        verifier.end();

        return verifier.verify(publicKey, this.signature, 'hex');
    }
}


export default Transaction;