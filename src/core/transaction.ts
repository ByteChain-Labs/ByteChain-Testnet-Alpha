import base58 from "bs58";
import elliptic_pkg from 'elliptic';
import { BC_NAME, Tx_Type } from "../utils/core_constants.js";
import { hash_tobuf, hash_tostr } from "../utils/crypto.js";


const  { ec: EC } = elliptic_pkg;
const ec = new EC('secp256k1');


class Transaction {
    type: Tx_Type;
    amount: number;
    sender: string;
    recipient: string;
    bytecode?: string; 
    contract_addr?: string;
    signature: string;
    nonce: number;
    timestamp: number;
    publicKey: string;

    constructor(
        amount: number,
        sender: string,
        recipient: string,
        type: Tx_Type,
        timestamp: number,
        publicKey: string,
        signature: string,
        nonce: number,
        bytecode?: string,
        contract_addr?: string
    ) {
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.type = type;
        this.timestamp = timestamp;
        this.publicKey = publicKey;
        this.signature = signature;
        this.nonce = nonce;

        if (this.type === Tx_Type.BYTE_TX) {
        } else if (this.type === Tx_Type.CONTRACT || (bytecode || contract_addr) !== undefined) {
            this.contract_addr = contract_addr;
            this.bytecode = bytecode;
        } else if (this.type === Tx_Type.CONTRACT_CALL || contract_addr !== undefined) {
            this.contract_addr = contract_addr;
        } else {
            throw new Error('Unknown transaction type');
        }
    }

    private get_signing_data(): string {
        if (this.type === Tx_Type.BYTE_TX) {
            return `${this.type}${this.amount}${this.sender}${this.recipient}${this.publicKey}${this.nonce}${this.timestamp}`;
        } else if ((this.bytecode || this.contract_addr) !== undefined || this.type === Tx_Type.CONTRACT) {
            return `${this.type}${this.amount}${this.sender}${this.recipient}${this.publicKey}${this.nonce}${this.timestamp}${this.bytecode}${this.contract_addr}`;
        } else if (this.contract_addr !== undefined || this.type === Tx_Type.CONTRACT_CALL) {
            return `${this.type}${this.amount}${this.sender}${this.recipient}${this.publicKey}${this.nonce}${this.timestamp}${this.contract_addr}`;
        }
        
        throw new Error('Unknown transaction type');
    }

    get_tx_nonce(): number {
        return this.nonce;
    }

    compute_contract_addr() {
        const c_addr = hash_tostr(this.get_signing_data());
        this.contract_addr = c_addr;
    }

    verify_tx_sig(): boolean {
        if (this.sender === BC_NAME) {
            return true;
        }

        const { amount, sender, recipient, publicKey, signature, nonce, timestamp } = this;

        if (amount === undefined || !sender || !recipient || !signature || nonce === undefined || timestamp === undefined) {
            throw new Error("Incomplete transaction data.")
        }
        
        try {
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
            throw new Error('Transaction signature verification failed');
        }
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

            return this;
        } catch (err) {
            throw new Error('Unable to sign transaction from tx-class');
        }
    }

    // Todo implement this method
    is_valid_tx(): boolean {
        try {
            const currentTime = Date.now();
            const MAX_TIME_DIFF = 300000;

            if (Math.abs(currentTime - this.timestamp) > MAX_TIME_DIFF) {
                throw new Error('Transaction timestamp is too old or in future');
            }

            return this.verify_tx_sig();
        } catch (err) {
            throw new Error('Transaction is invalid');
        }
    }
}

export default Transaction;