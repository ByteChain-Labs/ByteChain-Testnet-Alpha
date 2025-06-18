import crypto from 'crypto';
import { ec as EC } from 'elliptic';
import base58 from 'bs58';
import { TxPlaceHolder } from '../utils/core_constants';
import { hash_tobuf } from '../utils/crypto';
import BlockChain from '../core/blockchain';

const ec = new EC('secp256k1');

const bytechain = new BlockChain();

class Account {
    private priv_key: string;
    pub_key: string;
    blockchain_addr: string;
    private n_nonce: number;
    private balance: number;

    constructor(priv_key?: string) {
        if (priv_key) {
            this.priv_key = priv_key;
            this.pub_key = Account.create_pub_key(this.priv_key);
            this.blockchain_addr = Account.create_blockchain_addr(this.pub_key);
            this.n_nonce = bytechain.addr_nonce.get(this.blockchain_addr) ?? 0;
            this.balance = bytechain.addr_bal.get(this.blockchain_addr) ?? 0;// For now using the blockchain but will be changed to get it from a node instance
        } else {
            this.priv_key = ec.genKeyPair().getPrivate('hex');
            this.pub_key = Account.create_pub_key(this.priv_key);
            this.blockchain_addr = Account.create_blockchain_addr(this.pub_key);
            this.n_nonce = 0;
            this.balance = bytechain.addr_bal.get(this.blockchain_addr) ?? 0;
        }
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
    sign_tx(transaction: TxPlaceHolder): { signature: string, tx_nonce: number } {
        try {
            const { amount, sender, recipient } = transaction;

            if (!amount || !sender || !recipient) {
                throw new Error("Incomplete transaction data.")
            }
            const data_str = `${amount}${sender}${recipient}${this.n_nonce + 1}`;
            const hashed_tx = hash_tobuf(data_str);
            const key_pair = ec.keyFromPrivate(this.priv_key, 'hex');
            const sig = key_pair.sign(hashed_tx, 'hex');
            const r = sig.r.toArrayLike(Buffer, 'be', 32);
            const s = sig.s.toArrayLike(Buffer, 'be', 32);
            const compact_sig = Buffer.concat([r, s]);
            const signature = base58.encode(compact_sig);

            this.n_nonce += 1;
            const tx_nonce = this.n_nonce;
                    
            return { signature, tx_nonce };
        } catch (err) {
            this.n_nonce -= 1;
            throw new Error('Unable to sign transaction');
        }
    }
}


export default Account;
