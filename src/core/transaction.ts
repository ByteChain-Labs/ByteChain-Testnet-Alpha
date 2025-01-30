import { hash_tobuf } from "../utils/crypto";
import base58 from "bs58";
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');


class Transaction {
    amount: number;
    sender: string;
    recipient: string;
    signature: string;
    comment?: string;

    constructor(amount: number, sender: string, recipient: string, signature: string, comment?: string) {
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.signature = signature;
        this.comment = comment;
    }

    static verify_tx_sig(transaction: Transaction, publicKey: string): boolean {
        const { amount, sender, recipient, comment, signature } = transaction;
        
        const tx_data_str = comment 
            ?`${amount}${sender}${recipient}${comment}`
            :`${amount}${sender}${recipient}`;
        
        const base58_sig = signature
        const compact_sig = base58.decode(base58_sig);

        const r = compact_sig.slice(0, 32);
        const s = compact_sig.slice(32, 64);
        const tx_signature = { r, s };
        const hashed_tx = hash_tobuf(tx_data_str);
        const key = ec.keyFromPublic(publicKey, 'hex');
        
        return key.verify(hashed_tx, tx_signature);
    }
}

export default Transaction;