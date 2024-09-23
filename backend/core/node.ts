import Blockchain from './blockchain';
import Block from './block';
import Wallet from '../client/wallet';
import Transaction from './transaction';
import axios from 'axios';

class BlockchainNode {
    blockchain: Blockchain;
    wallet: Wallet;
    peers: string[];
    isMiner: boolean;

    constructor() {
        this.wallet = new Wallet();
        this.blockchain = new Blockchain(this.wallet.blockchainAddress);
        this.peers = [];
        this.isMiner = false;
    }

    AddTransaction(transaction: Transaction, pubKey: string): void {
        this.blockchain.AddNewTransaction(transaction, pubKey);
        this.BroadCastTransaction(transaction);
    }

    async StartMining() {
        while (true) {
            if (this.isMiner) {
                this.blockchain.Mine();
                const newBlock = this.blockchain.GetLastBlock();
                this.BroadCastBlock(newBlock);
                await this.SyncWithPeers();
            }
            await this.WaitForNextBlock();
        }
    }

    async WaitForNextBlock(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, this.blockchain.blockTime));
    }

    BroadCastTransaction(transaction: Transaction): void {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/transactions`, transaction)
                .catch(error => console.error(`Error broadcasting transaction: ${error.message}`));
        });
    }

    BroadCastBlock(block: any): void {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/blocks`, block)
                .catch(error => console.error(`Error broadcasting block: ${error.message}`));
        });
    }

    async SyncWithPeers(): Promise<void> {
        this.peers.forEach(async peerUrl => {
            try {
                const response = await axios.get(`${peerUrl}/blocks`);
                const otherBlocks = response.data as Block[];
                otherBlocks.forEach(block => {
                    this.blockchain.SyncBlocks(block);
                });
            } catch (error) {
                console.error(`Error syncing with peer ${peerUrl}: ${(error as Error).message}`);
            }
        });
    }
}

export default BlockchainNode;