import Transaction from "./transaction";
import { BlockType } from "../utils/core_constants";
import ProofOfWork from '../consensus/pow'
import BuildMerkleTree from '../utils/merkletree'

class Block {
    blockHeader: BlockType;
    transactions: Transaction[];

    constructor(blockHeight: number, transactions: Transaction[], prevBlockHash: string) {
        this.blockHeader = { 
            nonce: 0, 
            blockHeight,
            timestamp: Date.now(), 
            merkleroot: '', 
            prevBlockHash, 
            blockHash: ''
        };
        this.transactions = transactions;
    }

    SetBlockProps(MiningDifficulty: number): void {
        this.blockHeader.merkleroot = this.CalculateMerkleRoot();
        const blockDataAsStr = `${this.blockHeader.blockHeight}${this.blockHeader.nonce}${JSON.stringify(this.transactions)}${this.blockHeader.merkleroot}${this.blockHeader.prevBlockHash}`;
        
        const { hash, nonce } = ProofOfWork(blockDataAsStr, MiningDifficulty);
        
        this.blockHeader.blockHash = hash;
        this.blockHeader.nonce = nonce;
    }

    CalculateMerkleRoot(): string {
        return this.transactions.length ? BuildMerkleTree(this.transactions) : '';
    }
}


export default Block;