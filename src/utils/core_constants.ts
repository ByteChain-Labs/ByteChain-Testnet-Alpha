const BlockReward: number = 1024;
const BlockTime: number = 100;

type TxPlaceHolder = {
    amount: number,
    sender: string,
    recipient: string,
    timestamp: number,
}

type BlockHeader = {
    nonce: number,
    block_height: number,
    timestamp: number,
    merkleroot: string,
    prev_block_hash: string,
    block_hash: string
}

const print = (...data: any): void => {
    console.log(...data);
}


export { BlockTime, TxPlaceHolder, BlockReward, BlockHeader, print };