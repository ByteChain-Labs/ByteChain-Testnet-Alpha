import Block from "./block";
import Transaction from "./transaction";
import { BlockChainAddress, BlockChainPubKey, BlockReward, BlockTime, genBlockPrevHash } from "../utils/core_constants";
import Account from "../accounts/account";

class BlockChain {
    chain: Block[];
    trxPool: Transaction[];
    addrBal: Map<string, number>
    difficulty: number = 5;

    constructor() {
        this.chain = [];
        this.trxPool = [];
        this.addrBal = new Map<string, number>();
        this.GenesisBlock();
    }

    GenesisBlock(): void {
        const genTrx: Transaction = new Transaction(1000000000, BlockChainAddress, 'john', '')
        this.AddTransaction(genTrx, BlockChainPubKey);
        const genBlock = new Block(0, [genTrx], genBlockPrevHash)

        this.chain.push(genBlock)
    }

    GetBalance(address: string): number {
        return this.addrBal.get(address) || 0;
    }

    GetLastBlock(): Block {
        const lastBlock: Block = this.chain[this.chain.length - 1];

        return lastBlock;
    }

    AddTransaction(transaction: Transaction, publicKey: Account['publicKey']): Transaction {
        if (publicKey === BlockChainPubKey) {
            this.trxPool.push(transaction);
            return transaction;
        };

        const { amount, sender, recipient } = transaction;

        if (!amount || !sender || !recipient || !transaction.timestamp || !transaction.signature) {
            throw new Error('Incomplete transaction detail');
        }

        const currBal = this.addrBal.get(recipient) || 0;

        if (amount > currBal) {
            throw new Error('Insufficient fund');
        }

        if (!Transaction.VerifyTrxSig(transaction, publicKey)) {
            throw new Error('Invalid Transaction');
        }

        this.addrBal.set(sender, currBal - amount);
        
        this.trxPool.push(transaction);
        return transaction;
    }

    AddBlock(): Block {
        const height = this.GetLastBlock().blockHeader.blockHeight + 1;
        const transactions = this.trxPool;
        const previousBlockHash = this.GetLastBlock().blockHeader.blockHash;
        const newBlock = new Block(height, transactions, previousBlockHash)

        const blockTransactions = newBlock.transactions;

        for (const transaction of blockTransactions) {
            const { amount,  recipient } = transaction;

            const currBal = this.addrBal.get(recipient) || 0;

            this.addrBal.set(recipient, currBal + amount)
        }

        newBlock.SetBlockProps(this.difficulty);

        this.chain.push(newBlock)
        this.trxPool = [];
        return newBlock;
    }

    CalculateDifficulty(): void {
        const currBlockHeader: Block['blockHeader'] = this.GetLastBlock().blockHeader;
        const prevBlockHeader: Block['blockHeader'] = this.chain[this.chain.length - 2].blockHeader;
        const diffInTime: number = currBlockHeader.timestamp - prevBlockHeader.timestamp;
        if (this.difficulty < 1) {
            this.difficulty = 1;
        }
        if (this.difficulty > 5) {
            this.difficulty = 5;
        }
        if (diffInTime < BlockTime) {
            this.difficulty = this.difficulty + 1;
        } else if (diffInTime > BlockTime) {
            this.difficulty = this.difficulty - 1;
        } else {
            this.difficulty = this.difficulty;
        }
    }

    MineBlock(minerAddr: string): Block {
        const rewardTrx = new Transaction(BlockReward, BlockChainAddress, minerAddr, '');
        this.AddTransaction(rewardTrx, BlockChainPubKey);

        const block = this.AddNewBlock();
        block;


        return block;
    }

    IsBlockValid(block: Block, prevBlock: Block): boolean { 
        if (!(block instanceof Block) || !(prevBlock instanceof Block)) {
            return false;
        }

        if (!block.blockHeader.blockHash) {
            return false;
        }

        if (block.blockHeader.prevBlockHash !== prevBlock.blockHeader.blockHash) {
            return false;
        }

        const blockHeader = block.blockHeader;
        const prevBlockHeader = prevBlock.blockHeader;

        if (blockHeader.prevBlockHash != prevBlockHeader.blockHash) { 
            console.error(`Block with height: ${blockHeader.blockHeight} has wrong previous hash`); 
            return false; 
        } else if (blockHeader.blockHeight != prevBlockHeader.blockHeight + 1) { 
            console.error(`Block with height: ${blockHeader.blockHeight} is not the next block after the latest: ${prevBlockHeader.blockHeight}`);
            return false; 
        }

        return true 
    }


    IsChainValid(chain: [Block]): boolean {
        for (let i = 1; i < chain.length; i++) {
            if (i == 0) { 
                continue; 
            } 
            const currentBlock = chain[i];
            const prevBlock = chain[i - 1];

            this.IsBlockValid(currentBlock, prevBlock);
        }
        
        return true;
    }

    SyncChain(local: [Block], remote: [Block]): [Block] { 
        let is_local_valid = this.IsChainValid(local); 
        let is_remote_valid = this.IsChainValid(remote); 
 
        if (is_local_valid && is_remote_valid) { 
            if (local.length >= remote.length) { 
                return local 
            } else { 
                return remote 
            } 
        } else if (is_remote_valid && !is_local_valid) { 
            return remote 
        } else if (!is_remote_valid && is_local_valid) { 
            return local 
        } else { 
            console.error("local and remote chains are both invalid"); 
        } 

        return local;
    }
}


export default BlockChain;
