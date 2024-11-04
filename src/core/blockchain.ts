import Block from "./block";
import Transaction from "./transaction";
import { BlockChainAddress, genBlockPrevHash } from "../utils/core_constants";
import Account from "../accounts/account";

class BlockChain {
    chain: Block[];
    trxPool: Transaction[];

    constructor() {
        this.chain = [];
        this.trxPool = [];
        this.GenesisBlock();
    }

    GenesisBlock(): void {
        const genTrx: Transaction = new Transaction(1000000000, BlockChainAddress, 'john', '')
        const genBlock = new Block(0, [genTrx], genBlockPrevHash, '')

        this.chain.push(genBlock)
    }

    GetLastBlock(): Block {
        const lastBlock: Block = this.chain[this.chain.length - 1];

        return lastBlock;
    }

    AddNewtransaction(transaction: Transaction, publicKey: Account['publicKey']): Transaction {
        if (!transaction.trxHeader || !transaction.timestamp || !transaction.signature) {
            throw new Error('Incomplete transaction detail');
        }

        if (!transaction.trxHeader.amount || transaction.trxHeader.sender || transaction.trxHeader.recipient) {
            throw new Error('Transaction should contain amount or sender or recipient');           
        }

        if (!Transaction.VerifyTrxSig(transaction, publicKey)) {
            throw new Error('Incorrect user public key');
        }

        this.trxPool.push(transaction)
        return transaction;
    }

    AddNewBlock(block: Block, signature: Block['nodeSig']): Block {
        // Block.VerifyBlockSig()

        this.chain.push(block)
        return block;
    }
}


export default BlockChain;