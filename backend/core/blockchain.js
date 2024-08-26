//Importing the block and transaction class
const Block = require('./block');
const Transaction = require('./transaction');



//BlockChain class
class BlockChain {
    constructor () {
        this.chain = [];
        this.transactionPool = [];
        this.blockChainAddress = '0'.repeat(25) + 'BYTECHAIN';
        this.GenesisBlock();
    }

    //Creating genesis block
    GenesisBlock() { 
        const GenesisTransactionAmount = 0;
        const GenesisTransactionRecipient = 'The-ByteChain-BlockChain'; 
        const GenesisBlockPrevHash = '0'.repeat(64)

        const genesisTransaction = new Transaction(
            GenesisTransactionAmount,
            this.blockChainAddress,
            GenesisTransactionRecipient
        );

        const genesisTransactionArr = [genesisTransaction];

        const genesisBlock = new Block(1, genesisTransactionArr, genesisTransactionArr.length, GenesisBlockPrevHash);
        
        genesisBlock.ProofOfWork();
        this.chain.push(genesisBlock);
    }

    //Getting the last block in the chain
    GetLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    //Creating and Adding a new transaction to the transaction pool
    AddNewTransaction(transaction, pubKey) {
        if (!(transaction instanceof Transaction)) {
            throw new TypeError('Invalid transaction format');
        }

        if (!transaction.IsValidTransaction(pubKey)) {
            throw new Error('Invalid transaction');
        }

        this.transactionPool.push(transaction);
        return transaction;
    }

    //Creating a new block
    AddNewBlock() {
        const blockHeight = this.chain.length + 1;
        const transactions = this.transactionPool;
        const trxCount = transactions.length;
        const prevBlockHash = this.GetLastBlock().blockHash;
        const newBlock = new Block(blockHeight, transactions, trxCount, prevBlockHash);
        newBlock.ProofOfWork();

        this.transactionPool = []
        this.chain.push(newBlock);

        return newBlock; 
    }

    //Calculating a user's balance and returning it;
    CalculateBalance(blockChainAddress) {
        let balance = 0.00000000;
        const chain = this.chain;
        chain.forEach(block => {
            const transactions =  block.transactions;
            transactions.forEach(transaction => {
                const amount = transaction.amount;
                const sender = transaction.sender;
                const recipient = transaction.recipient;
                if (blockChainAddress === sender) {
                    balance -= amount;
                } else if (blockChainAddress === recipient) {
                    balance += amount;
                }                
            });
        });
        return balance.toFixed(8);
    }

    AllTransactionsMade(blockChainAddress) {
        // TODO
    }

    SyncBlocks(block) {
        //TODO
    }

    IsChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const prevBlock = this.chain[i -1];

            if (!(currentBlock instanceof Block) || !(prevBlock instanceof Block)) {
                return false;
            }
            if (!currentBlock.ContainValidTransactions()) {
                return false
            }

            if (currentBlock.blockHash !== currentBlock.HashBlock()) {
                return false
            }

            if (currentBlock.prevBlockHash !== prevBlock.blockHash) {
                return false
            }
        }
        return true;
    }
}


module.exports = BlockChain;
