const BlockReward: number = 1024;
const BlockTime: number = 5000;

type TxPlaceHolder = {
    amount: number,
    sender: string,
    recipient: string,
    comment?: string
}

type BlockHeader = {
    nonce: number,
    block_height: number,
    timestamp: number,
    merkleroot: string,
    prev_block_hash: string,
    block_hash: string
}


export { BlockTime, TxPlaceHolder, BlockReward, BlockHeader };