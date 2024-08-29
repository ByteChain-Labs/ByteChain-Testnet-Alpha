const Wallet = require('../client/wallet')
const { hashTransaction } = require('../util/util')
const elliptic = require('elliptic').ec;
const ec = new elliptic('secp256k1');

const wallet = new Wallet();

// Transaction class
class Transaction {
    constructor (amount, sender, recipient, signature) {
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient; 
        this.signature = signature;
    }

    

    static SignTransaction(amount, sender, recipient, privateKey) {
        const publicKey = wallet.CreatePublicKey(privateKey);
        const generatedAddress = wallet.CreateBlockChainAddress(publicKey)

        if (generatedAddress !== sender) {
            throw new Error('You cannot sign transaction for another wallet.');
        }
    
        const hashedTransaction = hashTransaction(amount, sender, recipient)
        const keyFromPrivate = ec.keyFromPrivate(privateKey);
        const sig = keyFromPrivate.sign(hashedTransaction, 'base64');
        const signature = sig.toDER('hex');

        return signature;
    }

    //Validating a transaction if it has been signed by the owner of a particular wallet
    IsValidTransaction(pubKey) {
        const BlockChainAddress = '0'.repeat(25) + 'BYTECHAIN';
        if (this.sender === BlockChainAddress) return true;

        if (!this.signature) {
            throw new Error('This transaction does not contain a signature');
        }
        
        try {
            const publicKey = ec.keyFromPublic(pubKey, 'hex');

            const isValid = publicKey.verify(hashTransaction(this.amount, this.sender, this.recipient), this.signature);

            if (!isValid) {
                console.error('Transaction signature verification failed');
            }
            return isValid;
        } catch (error) {
            console.error('Error validating transaction:', error.message);
            return false;
        }
    }
}


module.exports = Transaction;