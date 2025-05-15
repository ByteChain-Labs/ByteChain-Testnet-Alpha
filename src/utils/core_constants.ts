const BlockReward: number = 1024;
const BlockTime: number = 100;

const MIN_DIFFICULTY = 3;
const MAX_DIFFICULTY = 8;

const BLOCK_WINDOW = 4;

type TxPlaceHolder = {
    amount: number,
    sender: string,
    recipient: string,
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


export { BlockTime, TxPlaceHolder, BlockReward, BlockHeader, MIN_DIFFICULTY, MAX_DIFFICULTY, BLOCK_WINDOW, print };