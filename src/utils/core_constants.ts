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

export { TransactionType, BlockType };