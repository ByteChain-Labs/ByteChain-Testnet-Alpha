import BlockChain from './blockchain';
import Wallet from '../accounts/wallet';
import Transaction from './transaction';
import Account from '../accounts/account';
import { TcpClient, TcpServer } from '../network/p2p';
import Block from './block';
import { todo } from 'node:test';

class Node {
    blockchain: BlockChain
    isMiner: boolean = false;
    protected wallet: Wallet;

    constructor() {
        this.blockchain = new BlockChain();
        this.wallet = new Wallet();
    }

    Start() {
        const server = new TcpServer();
        // server.Start();
    }

    AddNewTransaction(transaction: Transaction, publicKey: Account['publicKey']) {
        if (!transaction && !publicKey) {
            throw new Error('Transaction and public key are required to perform this operation');
        }

        const { amount, sender, recipient, signature } = transaction;

        if (!amount && !sender && !recipient && !signature) {
            throw new Error('Invalid transaction provided');
        }

        const trx = this.blockchain.AddTransaction(transaction, publicKey);

        todo("create a method to broadcast transactions to other nodes");
        // BroadcastTransaction(trx);

        return trx;
    }

    MineBlock() {
        if (!this.isMiner) {
            console.log('You are not a miner now.')
        }

        const block = this.blockchain.MineBlock(this.wallet.account.blockchainAddress);

        todo("create a method to broadcast blocks to other nodes");
        // BroadcastBlock(block);

        return block;
    }
}




export default Node;