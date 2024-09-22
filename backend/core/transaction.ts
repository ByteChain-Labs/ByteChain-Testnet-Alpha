import Wallet from '../client/wallet';
import { hashTransaction } from '../util/crypto';
import { ec as EC } from 'elliptic';
const ec = new EC('secp256k1');

// Create a new wallet instance
const wallet = new Wallet();

class Transaction {
    amount: number;
    sender: string;
    recipient: string;
    signature: string;

    constructor(amount: number, sender: string, recipient: string, signature: string) {
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.signature = signature;
    }

    // Static method to sign a transaction
    static SignTransaction(amount: number, sender: string, recipient: string, privateKey: string): string {
        const publicKey = wallet.CreatePublicKey(privateKey);
        const generatedAddress = wallet.CreateBlockChainAddress(publicKey);

        if (generatedAddress !== sender) {
            throw new Error('You cannot sign transactions for another wallet.');
        }

        // Hash the transaction
        const hashedTransaction = hashTransaction(amount, sender, recipient);
        const keyFromPrivate = ec.keyFromPrivate(privateKey);
        const sig = keyFromPrivate.sign(hashedTransaction, 'base64');
        const signature = sig.toDER('hex');

        return signature;
    }

    // Validate the transaction to check if it's signed by the owner of the wallet
    IsValidTransaction(pubKey: string): boolean {
        const BlockChainAddress = '0'.repeat(25) + 'BYTECHAIN';

        if (this.sender === BlockChainAddress) return true;

        if (!this.signature) {
            throw new Error('This transaction does not contain a signature');
        }

        try {
            const publicKey = ec.keyFromPublic(pubKey, 'hex');
            const isValid = publicKey.verify(
                hashTransaction(this.amount, this.sender, this.recipient),
                this.signature
            );

            if (!isValid) {
                console.error('Transaction signature verification failed');
            }

            return isValid;
        } catch (error) {
            console.error('Error validating transaction:', (error as Error).message);
            return false;
        }
    }
}

export default Transaction;
