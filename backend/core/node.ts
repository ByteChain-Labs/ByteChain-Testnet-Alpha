import Blockchain from './blockchain';
import Wallet from '../client/wallet';
import Transaction from './transaction';
import Block from './block';
import axios from 'axios';

const wallet = new Wallet();
const bytechain = new Blockchain(wallet.blockchainAddress);

const bootstrapNodes: string[] = [];

class Node {
    blockchain: Blockchain;
    port: number;
    peers: string[];
    isMiner: boolean;
    minerAddress: string;

    constructor() {
        this.blockchain = bytechain;
        this.port = 3000;
        this.peers = [];
        this.isMiner = false;
        this.minerAddress = wallet.blockchainAddress;
    }

    ConnectToBootstrapNodes(): void {
        bootstrapNodes.forEach(nodeUrl => {
            axios.get(`${nodeUrl}/peers`).then(response => {
                const peers = (response.data as { peers: string[] }).peers;
                this.peers.push(...peers);
            }).catch(error => {
                console.error(`Error connecting to bootstrap node ${nodeUrl}:`, error.message);
            });
        });
    }

    // Calculate balance for a particular blockchain address
    CalculateBalance(blockChainAddress: string): string {
        let balance: number = 0.000;

        this.blockchain.chain.forEach(block => {
            const transactions: Transaction[] = block.transactions;
            transactions.forEach(transaction => {
                if (blockChainAddress === transaction.sender) {
                    balance -= transaction.amount;
                } else if (blockChainAddress === transaction.recipient) {
                    balance += transaction.amount;
                }
            });
        });

        return balance.toFixed(3);
    }

    AddTransaction(transaction: Transaction, pubKey: string): void {
        this.blockchain.AddNewTransaction(transaction, pubKey);
        this.BroadCastTransaction(transaction);
    }

    SelectMiner(): void {
        const minerPool = [...this.peers, `http://localhost:${this.port}`];
        const selectedMinerUrl = minerPool[Math.floor(Math.random() * minerPool.length)];

        if (selectedMinerUrl === `http://localhost:${this.port}`) {
            this.isMiner = true;
        } else {
            this.isMiner = false;
        }
    }

    AnnounceMiner(minerUrl: string): void {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/announce-miner`, { minerUrl }).catch(error => {
                console.error(`Error announcing miner to ${peerUrl}:`, error.message);
            });
        });
    }

    async StartMining(): Promise<void> {
        while (true) {
            if (this.isMiner) {
                this.blockchain.Mine();
                const newBlock = this.blockchain.GetLastBlock();
                this.BroadCastBlock(newBlock);
                await this.SyncWithPeers();
            } else {
                this.SelectMiner();
            }
            await this.WaitForNextBlock();
        }
    }

    async WaitForNextBlock(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, this.blockchain.blockTime));
    }

    BroadCastTransaction(transaction: Transaction): void {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/transactions`, transaction).catch(error => {
                console.error(`Error broadcasting transaction to ${peerUrl}:`, error.message);
            });
        });
    }

    BroadCastBlock(block: any): void {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/blocks`, block).catch(error => {
                console.error(`Error broadcasting block to ${peerUrl}:`, (error as Error).message);
            });
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
                console.error(`Error syncing with peer ${peerUrl}:`, (error as Error).message);
            }
        });
    }

    AddPeer(peerUrl: string): void {
        if (!this.peers.includes(peerUrl)) {
            this.peers.push(peerUrl);
        }
    }

    AnnounceToNetwork(): void {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/announce`, { peerUrl: `http://localhost:${this.port}` }).catch(error => {
                console.error(`Error announcing to ${peerUrl}:`, error.message);
            });
        });
    }
}

export default Node;
