import { hash_tobuf } from "../utils/crypto";
import base58 from "bs58";
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');


class Transaction {
    amount: number;
    sender: string;
    recipient: string;
    signature: string;
    n_nonce: number;
    timestamp: number;

    constructor(amount: number, sender: string, recipient: string, signature: string, n_nonce: number, timestamp: number) {
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.signature = signature;
        this.n_nonce = n_nonce;
        this.timestamp = timestamp
    }

    static verify_tx_sig(transaction: Transaction, publicKey: string): boolean {
        const { amount, sender, recipient, signature, n_nonce, timestamp } = transaction;
        
        const tx_data_str = `${amount}${sender}${recipient}${n_nonce}${timestamp}`;
        
        const base58_sig = signature
        const compact_sig = base58.decode(base58_sig);

        const r = compact_sig.slice(0, 32);
        const s = compact_sig.slice(32, 64);
        const tx_signature = { r, s };
        const hashed_tx = hash_tobuf(tx_data_str);
        const key = ec.keyFromPublic(publicKey, 'hex');
        
        return key.verify(hashed_tx, tx_signature);
    }

    // Todo implement this method
    // is_valid_tx(): boolean {
    //     return true;
    // }
}

export default Transaction;