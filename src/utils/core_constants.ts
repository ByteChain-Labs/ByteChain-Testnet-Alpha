import Transaction from "../core/transaction";
import Block from "../core/block";

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

export { TransactionType, BlockType, BlockchainMessage };