import crypto from 'crypto';
import { ec as EC } from 'elliptic';
import base58 from 'bs58';
import BlockChain from '../core/blockchain';
import Transaction from '../core/transaction';

const ec = new EC('secp256k1');


class Account {
    private priv_key: string;
    pub_key: string;
    blockchain_addr: string;
    bc_instance: BlockChain;

    constructor(bc_instance: BlockChain, priv_key?: string) {
        if (priv_key) {
            this.priv_key = priv_key;
            this.pub_key = Account.create_pub_key(this.priv_key);
            this.blockchain_addr = Account.create_blockchain_addr(this.pub_key);
        } else {
            this.priv_key = ec.genKeyPair().getPrivate('hex');
            this.pub_key = Account.create_pub_key(this.priv_key);
            this.blockchain_addr = Account.create_blockchain_addr(this.pub_key);
        }

        this.bc_instance = bc_instance;
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

    check_nonce(): number {
        return this.bc_instance.addr_nonce.get(this.blockchain_addr) ?? 0;
    }

    check_balance(): number {
        return this.bc_instance.addr_bal.get(this.blockchain_addr) ?? 0;
    }

    // Allow all accounts to be able to sign transaction
    acc_sign_tx(amount: number, recipient: string): Transaction {
        try {
            const next_nonce = this.check_nonce() + 1;

            if (amount < 0 || amount > this.check_balance()) {
                throw new Error('Invalid transaction amount'); 
            }

            if (amount < 0 || amount > this.check_balance()) {
                throw new Error('Invalid transaction amount'); 
            }
            
            const tx = new Transaction(amount, this.blockchain_addr, recipient, this.pub_key, "", next_nonce);
            const signed_tx = tx.sign_tx(this.priv_key);
            
            return signed_tx;
        } catch (err) {
            throw new Error('Unable to sign transaction from account class');
        }
    }
}


export default Account;
