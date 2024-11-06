import Transaction from "../core/transaction";
import Block from "../core/block";

const BlockChainAddress: string = `${'0'.repeat(24)}BYTECHAIN`
const BlockChainPubKey: string = `${'0'.repeat(121)}BYTECHAIN`
const genBlockPrevHash: string = '0'.repeat(32)
const BlockTime: number = 1500;

type TransactionType = {
    amount: number,
    sender: string,
    recipient: string
}

type BlockType = {
    nonce: number,
    blockHeight: number,
    timestamp: number;
    merkleroot: string;
    prevBlockHash: string;
    blockHash: string;
}

type BlockchainMessage = {
    type: 'newTransaction' | 'newBlock' | 'requestBlockchain' | 'syncBlockchain';
    payload: Transaction | Block;
};

export {
    TransactionType, 
    BlockType, 
    BlockchainMessage, 
    BlockChainAddress, 
    genBlockPrevHash, 
    BlockChainPubKey,
    BlockTime
};