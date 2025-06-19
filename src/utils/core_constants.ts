const BLOCK_TIME: number = 100;
const BLOCK_REWARD: number = 32;
const BC_NAME: string = "0xByteChain";

const MIN_DIFFICULTY = 3;
const MAX_DIFFICULTY = 8;

const BLOCK_WINDOW = 4;

type BlockHeader = {
    nonce: number,
    block_height: number,
    timestamp: number,
    merkleroot: string,
    prev_block_hash: string,
    block_hash: string
}

const print = (...data: any): void => {
    console.dir(...data, { depth: null, colors: true });
}


export { BLOCK_TIME, BLOCK_REWARD, BC_NAME, BlockHeader, MIN_DIFFICULTY, MAX_DIFFICULTY, BLOCK_WINDOW, print };