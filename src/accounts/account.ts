import crypto from 'crypto';
import elliptic_pkg from 'elliptic';
import base58 from 'bs58';
import Transaction from '../core/transaction.js';

const { ec: EC } = elliptic_pkg;
const ec = new EC('secp256k1');


class Account {
    private priv_key: string;
    pub_key: string;
    blockchain_addr: string;

    constructor(priv_key?: string) {
        if (priv_key) {
            this.priv_key = priv_key;
        } else {
            this.priv_key = ec.genKeyPair().getPrivate('hex');  
        }
        this.pub_key = Account.create_pub_key(this.priv_key);
        this.blockchain_addr = Account.create_blockchain_addr(this.pub_key);
    }

    static new(): { priv_key: string, pub_key: string, blockchain_addr: string} {
        const priv_key = ec.genKeyPair().getPrivate('hex');
        const pub_key = Account.create_pub_key(priv_key);
        const blockchain_addr = Account.create_blockchain_addr(pub_key);
        return { priv_key, pub_key, blockchain_addr };
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
        const checksum = crypto.createHash('sha256').update(
            crypto.createHash('sha256').update(payload).digest()
        ).digest().slice(0, 4);
        const final_payload = Buffer.concat([payload, checksum]);
        const blockchain_addr = base58.encode(final_payload);
        
        return blockchain_addr;
    }

    sign_tx(tx: Transaction): Transaction {
        return tx.sign_tx(this.priv_key);
    }
}


export default Account;
