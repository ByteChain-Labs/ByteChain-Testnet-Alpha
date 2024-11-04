import { ec as EC } from 'elliptic';
import Transaction from "./transaction";
import { BlockType } from "../utils/core_constants";
import ProofOfWork from '../consensus/pow'
import BuildMerkleTree from '../utils/merkletree'
import { HashBlock } from "../utils/crypto";
import base58 from "bs58";

const ec = new EC('secp256k1');

class Block {
    blockHeader: BlockType;
    transactions: Transaction[];
    nodeSig: string

    constructor(blockHeight: number, transactions: Transaction[], prevBlockHash: string, signature: string) {
        this.blockHeader = { 
            nonce: 0, 
            blockHeight,
            timestamp: Date.now(), 
            merkleroot: '', 
            prevBlockHash, 
            blockHash: ''
        };
        this.transactions = transactions;
        this.nodeSig = signature;


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

    static VerifyBlockSig(block: Block, publicKey: string): boolean {
        const trxDataAsStr: string = `${block.blockHeader.blockHash}${block.blockHeader.blockHeight}${block.blockHeader.merkleroot}${block.blockHeader.nonce}${block.blockHeader.prevBlockHash}${block.blockHeader.timestamp}${block.transactions}${block.nodeSig}`;
        const base58Signature = block.nodeSig
        const compactSignature = base58.decode(base58Signature);

        const r = compactSignature.slice(0, 32);
        const s = compactSignature.slice(32, 64);
        const signature = { r, s };
        const hashedTransaction = HashBlock(trxDataAsStr);
        const key = ec.keyFromPublic(publicKey, 'hex');
        
        return key.verify(hashedTransaction, signature);
    }
}


export default Block;