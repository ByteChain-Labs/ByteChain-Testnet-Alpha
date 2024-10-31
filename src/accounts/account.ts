import crypto from 'crypto';
import { ec as EC } from 'elliptic';
import bs58 from 'bs58';
import Transaction from '../core/transaction';

const ec = new EC('secp256k1');

class Account {
    privateKey: string;
    publicKey: string;
    blockchainAddress: string;

    constructor() {
        this.privateKey = ec.genKeyPair().getPrivate('hex');
        this.publicKey = this.CreatePublicKey(this.privateKey);
        this.blockchainAddress = this.CreateBlockChainAddress(this.publicKey);
    }

    // Generates the public key from a private key
    CreatePublicKey(privKey: string): string {
        const keyPair = ec.keyFromPrivate(privKey);
        const publicKey = keyPair.getPublic('hex');
        return publicKey;
    }

    // Creates a blockchain address from the public key
    CreateBlockChainAddress(publicKey: string): string {
        const publicKeyBuffer = Buffer.from(publicKey, 'hex');
        const sha256Hash = crypto.createHash('sha256').update(publicKeyBuffer).digest();
        const ripemd160Hash = crypto.createHash('ripemd160').update(sha256Hash).digest();
        const versionByte = Buffer.from([0xBC]); // Version byte 
        const payload = Buffer.concat([versionByte, ripemd160Hash]);
        const checksum = crypto.createHash('sha256').update(crypto.createHash('sha256').update(payload).digest()).digest().slice(0, 4);
        const finalPayload = Buffer.concat([payload, checksum]);
        const blockchainAddress = bs58.encode(finalPayload);
        
        return blockchainAddress;
    }

    SignTransaction(transaction: Transaction): void {
        const sign = crypto.createSign('sha256');
        sign.update(transaction.HashTransaction());
        sign.end();
        transaction.signature = sign.sign(this.privateKey, 'hex');
    }
}


export default Account;