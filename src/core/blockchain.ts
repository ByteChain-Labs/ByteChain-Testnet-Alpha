import Block from "./block";
import Transaction from "./transaction";
import { BlockChainAddress, BlockChainPubKey, BlockTime, genBlockPrevHash } from "../utils/core_constants";
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
        this.AddNewTransaction(genTrx, BlockChainPubKey);
        const genBlock = new Block(0, [genTrx], genBlockPrevHash)

        this.chain.push(genBlock)
    }

    GetLastBlock(): Block {
        const lastBlock: Block = this.chain[this.chain.length - 1];

        return lastBlock;
    }

    AddNewTransaction(transaction: Transaction, publicKey: Account['publicKey']): Transaction {
        if (publicKey === BlockChainPubKey) {
            this.trxPool.push(transaction)
            return transaction
        };

        const { amount, sender, recipient } = transaction.trxHeader

        if (!amount || sender || recipient || !transaction.timestamp || !transaction.signature) {
            throw new Error('Incomplete transaction detail');
        }

        if (!Transaction.VerifyTrxSig(transaction, publicKey)) {
            throw new Error('Incorrect user public key');
        }

        const currBal = this.addrBal.get(recipient) || 0;

        this.addrBal.set(sender, currBal - amount)
        
        this.trxPool.push(transaction)
        return transaction;
    }

    AddNewBlock(): Block {
        const height = this.GetLastBlock().blockHeader.blockHeight + 1;
        const transactions = this.trxPool;
        const previousBlockHash = this.GetLastBlock().blockHeader.blockHash;
        const newBlock = new Block(height, transactions, previousBlockHash)

        const blockTransactions = newBlock.transactions;

        for (const transaction of blockTransactions) {
            const { amount,  recipient } = transaction.trxHeader

            const currBal = this.addrBal.get(recipient) || 0;

            this.addrBal.set(recipient, currBal + amount)
        }

        this.chain.push(newBlock)
        this.trxPool = [];
        return newBlock;
    }

    GetBalance(address: string): number {
        return this.addrBal.get(address) || 0;
    }

    CalculateDifficulty(): void {
        const lastBlock: Block = this.GetLastBlock();
        const prevLastBlock: Block = this.chain[this.chain.length - 2];
        const diffInTime: number = lastBlock.blockHeader.timestamp - prevLastBlock.blockHeader.timestamp;
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

    IsChainValid(): boolean {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const prevBlock = this.chain[i - 1];

            if (!(currentBlock instanceof Block) || !(prevBlock instanceof Block)) {
                return false;
            }

            if (!currentBlock.blockHeader.blockHash) {
                return false;
            }

            if (currentBlock.blockHeader.prevBlockHash !== prevBlock.blockHeader.blockHash) {
                return false;
            }
        }
        return true;
    }
}


export default BlockChain;