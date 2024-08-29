const bootstrapNodes = [];
const VM = require('../vm/virtualMachine');

const Blockchain = require('./blockchain');
const Wallet = require('../client/wallet')
const Transaction = require('./transaction')

const axios = require('axios');

const bytechain = new Blockchain()
const wallet = new Wallet();

const MiningReward = 1024;

class Node {
    constructor() {
        this.blockchain = bytechain;        ;
        this.port = 3000; 
        this.peers = []; 
        this.isMiner = false;
        this.minerAddress = wallet.blockchainAddress
    }

    ConnectToBootstrapNodes() {
        bootstrapNodes.forEach(nodeUrl => {
            axios.get(`${nodeUrl}/peers`).then(response => {
                this.peers.push(...response.data.peers);
            }).catch(error => {
                console.error(`Error connecting to bootstrap node ${nodeUrl}:`, error.message);
            });
        });
    }

    AddTransaction(transaction, pubKey) {        
        this.blockchain.AddNewTransaction(transaction, pubKey);
        this.BroadCastTransaction(transaction);
    }

    AddContract(contract, pubKey) { 
        this.blockchain.AddNewContract(contract, pubKey);
        this.BroadCastContract(contract);
    }

    ExecuteSmartContract(filename) {
        const vm = new VM(filename)
        vm.ExecuteContract();
    }

    Mine() {
        const MiningRewardTransaction = new Transaction(MiningReward, this.blockchain.blockChainAddress, this.minerAddress);
        this.blockchain.AddNewTransaction(MiningRewardTransaction)
        this.blockchain.AddNewBlock(); //const newBlock = 

    }

    async StartMining() {
        while (true) {
            if (this.isMiner) {
                const MiningRewardTransaction = new Transaction(MiningReward, this.blockchain.blockChainAddress, this.minerAddress);
                this.blockchain.AddNewTransaction(MiningRewardTransaction)
                const newBlock = this.blockchain.AddNewBlock(); 
                this.BroadCastBlock(newBlock);
                await this.SyncWithPeers();
            } else {
                this.SelectMiner();
            }
            await this.WaitForNextBlock();
        }
    }

    async WaitForNextBlock() {
        await new Promise(resolve => setTimeout(resolve, this.blockchain.blockTime));
    }

    BroadCastTransaction(transaction) {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/transactions`, transaction).catch(error => {
                console.error(`Error broadcasting transaction to ${peerUrl}:`, error.message);
            });
        });
    }

    BroadCastContract(contract) {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/contracts`, contract).catch(error => {
                console.error(`Error broadcasting contract to ${peerUrl}:`, error.message);
            });
        });
    }

    BroadCastBlock(block) {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/blocks`, block).catch(error => {
                console.error(`Error broadcasting block to ${peerUrl}:`, error.message);
            });
        });
    }

    async SyncWithPeers() {
        this.peers.forEach(async peerUrl => {
            try {
                const response = await axios.get(`${peerUrl}/blocks`);
                const otherBlocks = response.data;
                this.blockchain.SyncBlocks(otherBlocks);
            } catch (error) {
                console.error(`Error syncing with peer ${peerUrl}:`, error.message);
            }
        });
    }

    SelectMiner() {
        const minerPool = [...this.peers, `http://localhost:${this.port}`];

        const selectedMinerUrl = minerPool[Math.floor(Math.random() * minerPool.length)];

        if (selectedMinerUrl === `http://localhost:${this.port}`) {
            this.isMiner = true; 
        } else {
            this.isMiner = false; 
        }

        // Announce the selected miner to the network
        this.AnnounceMiner(selectedMinerUrl);
    }

    AnnounceMiner(minerUrl) {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/announce-miner`, { minerUrl }).catch(error => {
                console.error(`Error announcing miner to ${peerUrl}:`, error.message);
            });
        });
    }

    AddPeer(peerUrl) {
        if (!this.peers.includes(peerUrl)) {
            this.peers.push(peerUrl);
        }
    }

    AnnounceToNetwork() {
        this.peers.forEach(peerUrl => {
            axios.post(`${peerUrl}/announce`, { peerUrl: `http://localhost:${this.port}` }).catch(error => {
                console.error(`Error announcing to ${peerUrl}:`, error.message);
            });
        });
    }
}



module.exports = Node;