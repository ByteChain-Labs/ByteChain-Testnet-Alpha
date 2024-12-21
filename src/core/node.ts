import BlockChain from './blockchain';
import Wallet from '../accounts/wallet';
import Transaction from './transaction';
import Account from '../accounts/account';
import { SignAdvertisement, VerifyAdvertisement, AdvertiseNode, ListenForNodes } from '../network/discover';
import { TcpClient, TcpServer } from '../network/p2p';
import Block from './block';

class BCNode {
    blockchain: BlockChain
    isMiner: boolean = false;
    protected wallet: Wallet;

    constructor() {
        this.blockchain = new BlockChain();
        this.wallet = new Wallet();
    }

    Start() {
        console.log(this.wallet);

        new TcpClient();
        new TcpServer();
        
        setInterval(() => {
            AdvertiseNode(this.wallet.account.privateKey)
            ListenForNodes(this.wallet.account.publicKey)
        }, 5000)
    }

    AddNewTransaction(transaction: Transaction, publicKey: Account['publicKey']) {
        this.blockchain.AddTransaction(transaction, publicKey);


    }

    // SelectMiner(): this {

    // }

    MineBlock() {
        if (!this.isMiner) {
            console.log('You are not a miner now.')
        }

        const block = this.blockchain.MineBlock(this.wallet.account.blockchainAddress);
        // BroadcastBlock(block);
    }

    AcceptBlock(block: Block): Block {
        // VerifyAdvertisement(block, )
        return block;
    }
}




export default BCNode;