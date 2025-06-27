import { hash_tobuf, hash_tostr } from "../utils/crypto";
import base58 from "bs58";
import { ec as EC } from 'elliptic';
import { BC_NAME } from "../utils/core_constants";

const ec = new EC('secp256k1');


class Transaction {
    amount: number;
    sender: string;
    recipient: string;
    id: string;
    private publicKey: string;
    private signature: string;
    nonce: number;
    timestamp: number;

    constructor(amount: number, sender: string, recipient: string, publicKey: string, signature: string, nonce: number) {
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.id = "";
        this.publicKey = publicKey;
        this.signature = signature;
        this.nonce = nonce;
        this.timestamp = Date.now();
    }

    private get_signing_data(): string {
        return `${this.amount}${this.sender}${this.recipient}${this.publicKey}${this.nonce}${this.timestamp}`;
    }


    verify_tx_sig(): boolean {
        try {
            const { amount, sender, recipient, publicKey, signature, nonce, timestamp } = this;

            if (!amount || !sender || !recipient || !signature || !nonce || !timestamp) {
                throw new Error("Incomplete transaction data.")
            }

            if (sender === BC_NAME) {
                return true;
            }
            
            const tx_data_str = this.get_signing_data();
            
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

    create_tx_id() {
        const tx_data_str = `${this.get_signing_data()}${this.signature}`;
        const id = hash_tostr(tx_data_str);

        this.id = id;
    }

    sign_tx(priv_key: string): Transaction {
        try {
            const data_str = this.get_signing_data();
            
            const hashed_tx = hash_tobuf(data_str);
            const key_pair = ec.keyFromPrivate(priv_key, 'hex');
            const sig = key_pair.sign(hashed_tx, 'hex');
            const r = sig.r.toArrayLike(Buffer, 'be', 32);
            const s = sig.s.toArrayLike(Buffer, 'be', 32);
            const compact_sig = Buffer.concat([r, s]);
            const sign = base58.encode(compact_sig);

            this.signature = sign;
            this.create_tx_id();

            return this;
        } catch (err) {
            throw new Error('Unable to sign transaction from tx-class');
        }
    }

    // Todo implement this method
    is_valid_tx(): boolean {
        try {
            const currentTime = Date.now();
            const MAX_TIME_DIFF = 300000; // 5 minutes in milliseconds

            if (Math.abs(currentTime - this.timestamp) > MAX_TIME_DIFF) {
                throw new Error('Transaction timestamp is too old or in future');
            }

            return this.verify_tx_sig();
        } catch (err) {
            throw new Error('Transaction in invalid');
        }
    }
}

export default Transaction;