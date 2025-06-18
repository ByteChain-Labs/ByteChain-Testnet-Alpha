import { hash_tobuf } from "../utils/crypto";
import base58 from "bs58";
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');


class Transaction {
    amount: number;
    sender: string;
    recipient: string;
    signature: string;
    nonce: number;
    timestamp: number;

    constructor(amount: number, sender: string, recipient: string, signature: string, nonce: number) {
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.signature = signature;
        this.nonce = nonce;
        this.timestamp = Date.now();
    }

    verify_tx_sig(publicKey: string): boolean {
        try {
            const { amount, sender, recipient, signature, nonce } = this;

            if (!amount || !sender || !recipient || !signature || !nonce) {
                throw new Error("Incomplete transaction data.")
            }
            
            const tx_data_str = `${amount}${sender}${recipient}${nonce}`;
            
            const base58_sig = signature
            const compact_sig = base58.decode(base58_sig);

            const r = compact_sig.slice(0, 32);
            const s = compact_sig.slice(32, 64);
            const tx_signature = { r, s };
            const hashed_tx = hash_tobuf(tx_data_str);
            const key = ec.keyFromPublic(publicKey, 'hex');
            
            return key.verify(hashed_tx, tx_signature);
        } catch (err) {
            throw new Error('Unable to verify transaction signature');
        }
    }

    // Todo implement this method
    is_valid_tx(pub_key: string): boolean {
        try {
            const currentTime = Date.now();
            const MAX_TIME_DIFF = 300000; // 5 minutes in milliseconds

            if (Math.abs(currentTime - this.timestamp) > MAX_TIME_DIFF) {
                throw new Error('Transaction timestamp is too old or in future');
            }

            return this.verify_tx_sig(pub_key);
        } catch (err) {
            throw new Error('Transaction in invalid');
        }
    }
}

export default Transaction;