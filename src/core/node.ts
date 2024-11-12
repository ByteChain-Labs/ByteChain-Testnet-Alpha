import BlockChain from './blockchain';
import Wallet from '../accounts/wallet';
import { SignAdvertisement, VerifyAdvertisement, AdvertiseNode, ListenForNodes } from '../network/discover';

class BCNode {
    blockchain: BlockChain
    protected wallet: Wallet;

    constructor() {
        this.blockchain = new BlockChain();
        this.wallet = new Wallet();
    }

    Start() {
        console.log(this.wallet);
        
        setInterval(() => {
            AdvertiseNode(this.wallet.account.privateKey)
            ListenForNodes(this.wallet.account.publicKey)
        }, 5000)
    }
}



export default BCNode;