import crypto from 'crypto';
import { ec as EC } from 'elliptic';
import base58 from 'bs58';
import { TxPlaceHolder } from '../utils/core_constants';
import { hash_tobuf } from '../utils/crypto';

const ec = new EC('secp256k1');

class Account {
    priv_key: string;
    pub_key: string;
    blockchain_addr: string;
    n_nonce: number;

    constructor() {
        this.priv_key = ec.genKeyPair().getPrivate('hex');
        this.pub_key = Account.create_pub_key(this.priv_key);
        this.blockchain_addr = Account.create_blockchain_addr(this.pub_key);
        this.n_nonce = 0;
    }

    // Generates the public key from a private key
    static create_pub_key(priv_key: string): string {
        const key_pair = ec.keyFromPrivate(priv_key);
        const pub_key = key_pair.getPublic('hex');
        return pub_key;
    }

    // Creates a blockchain address from the public key
    static create_blockchain_addr(pub_key: string): string {
        const pub_key_buffer = Buffer.from(pub_key, 'hex');
        const sha256_hash = crypto.createHash('sha256').update(pub_key_buffer).digest();
        const ripemd160_hash = crypto.createHash('ripemd160').update(sha256_hash).digest();
        const version_byte = Buffer.from([0xBC]); // Version byte 
        const payload = Buffer.concat([version_byte, ripemd160_hash]);
        const checksum = crypto.createHash('sha256').update(crypto.createHash('sha256').update(payload).digest()).digest().slice(0, 4);
        const final_payload = Buffer.concat([payload, checksum]);
        const blockchain_addr = base58.encode(final_payload);
        
        return blockchain_addr;
    }

    // Allow all accounts to be able to sign transaction
    sign_tx(transaction: TxPlaceHolder, priv_key: string): { base58_sig: string, tx_nonce: number } {
        const pub_key = Account.create_pub_key(priv_key);
        const generated_addr = Account.create_blockchain_addr(pub_key);

        if (generated_addr !== transaction.sender) {
            throw new Error('You cannot sign transactions for another account.');
        }

        const { amount, sender, recipient, timestamp } = transaction;
        const data_str = `${amount}${sender}${recipient}${timestamp}`;
        const hashed_tx = hash_tobuf(data_str);
        const key_pair = ec.keyFromPrivate(priv_key, 'hex')
        const signature = key_pair.sign(hashed_tx, 'hex');
        const r = signature.r.toArrayLike(Buffer, 'be', 32);
        const s = signature.s.toArrayLike(Buffer, 'be', 32);
        const compact_sig = Buffer.concat([r, s]);
        const base58_sig = base58.encode(compact_sig);

        this.n_nonce += 1;
        const tx_nonce = this.n_nonce;

        // So the private Key becomes inaccessible after signing a transaction
        priv_key = "";
        
        return { base58_sig, tx_nonce };
    }
}


export default Account;
