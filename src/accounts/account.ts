import crypto from 'crypto';
import { ec as EC } from 'elliptic';
import bs58 from 'bs58';
import Transaction from '../core/transaction';
import { TransactionType } from '../utils/core_constants';
import { HashTransaction } from '../utils/crypto';

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
    CreatePublicKey(privKey: Account['privateKey']): string {
        const keyPair = ec.keyFromPrivate(privKey);
        const publicKey = keyPair.getPublic('hex');
        return publicKey;
    }

    // Creates a blockchain address from the public key
    CreateBlockChainAddress(publicKey: Account['publicKey']): string {
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

    SignTransaction(transaction: TransactionType, privKey: Account['privateKey']): Transaction['signature'] {
        const publicKey = this.CreatePublicKey(privKey);
        const generatedAddress = this.CreateBlockChainAddress(publicKey);

        if (generatedAddress !== transaction.sender) {
            throw new Error('You cannot sign transactions for another account.');
        }

        const { amount, sender, recipient } = transaction;
        const dataStr = `${amount}${sender}${recipient}`;
        const hashedTransaction = HashTransaction(dataStr);
        const sign = crypto.createSign('SHA256');
        sign.update(hashedTransaction);
        sign.end();
        const signature = sign.sign(privKey, 'hex');

        return signature;
    }
}


export default Account;