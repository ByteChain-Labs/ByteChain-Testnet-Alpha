const Wallet = require('../client/wallet')
const { hashContract } = require('../util/util')
const elliptic = require('elliptic').ec;
const ec = new elliptic('secp256k1');

const wallet = new Wallet();

class Contract {
    constructor(code, fromAddress, signature) {
        this.code = code;
        this.fromAddress = fromAddress;
        this.signature = signature;
    }

    static SignContract(code, fromAddress, privateKey) {
        const publicKey = wallet.CreatePublicKey(privateKey);
        const generatedAddress = wallet.CreateBlockChainAddress(publicKey)

        if (generatedAddress !== fromAddress) {
            throw new Error('You cannot sign transaction for another wallet.');
        }
    
        const hashedContract = hashContract(code, fromAddress, )
        const keyFromPrivate = ec.keyFromPrivate(privateKey);
        const sig = keyFromPrivate.sign(hashedContract, 'base64');
        const signature = sig.toDER('hex');

        return signature;
    }

    //Validating a contract if it has been signed by the owner of a particular wallet
    IsValidContract(pubKey) {
        if (!this.signature) {
            throw new Error('This contract does not contain a signature');
        }
        
        try {
            const publicKey = ec.keyFromPublic(pubKey, 'hex');

            const isValid = publicKey.verify(hashContract(this.code, this.fromAddress), this.signature);

            if (!isValid) {
                console.error('Contract signature verification failed');
            }
            return isValid;
        } catch (error) {
            console.error('Error validating contract:', error.message);
            return false;
        }
    }
}


module.exports = Contract;