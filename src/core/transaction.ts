import base58 from 'bs58';
import { ec as EC } from 'elliptic';
import { TransactionType } from '../utils/core_constants';
import { HashTransaction } from '../utils/crypto';

const ec = new EC('secp256k1');

class Transaction {
    trxHeader: TransactionType;
    signature: string;
    readonly timestamp: number;

    constructor(amount: number, sender: string, recipient: string, signature: string) {
        this.trxHeader = { amount, sender, recipient };
        this.timestamp = Date.now();
        this.signature = signature;
    }

    VerifyTrxSig(transaction: Transaction, publicKey: string): boolean {
        const trxDataAsStr: string = `${transaction.trxHeader.amount}${transaction.trxHeader.sender}${transaction.trxHeader.recipient}${transaction.timestamp}`;
        const base58Signature = transaction.signature
        const compactSignature = base58.decode(base58Signature);

        const r = compactSignature.slice(0, 32);
        const s = compactSignature.slice(32, 64);
        const signature = { r, s };
        const hashedTransaction = HashTransaction(trxDataAsStr);
        const key = ec.keyFromPublic(publicKey, 'hex');
        
        return key.verify(hashedTransaction, signature);
    }
}


export default Transaction;