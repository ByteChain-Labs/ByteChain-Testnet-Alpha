const BLOCK_TIME_DIFF: number = 600; // in milliseconds, 600ms = 0.6 seconds
const BLOCK_REWARD: number = 32;
const BC_NAME: string = "0xByteChain";
const BC_NAME_PUB: string = "0xByteChainPublicKey";
const GEN_PREV_HASH: string = "0x00000000000000000000000000000000ByteChain";

const MIN_DIFFICULTY = 4;
const MAX_DIFFICULTY = 10;

const BLOCK_WINDOW = 3;

interface BlockHeader {
    nonce: number;
    block_height: number;
    timestamp: number;
    merkleroot: string;
    prev_block_hash: string;
    block_hash: string;
    difficulty: number;
}

const print = (...data: any): void => {
    console.dir(...data, { depth: null, colors: true });
}


export { 
    BLOCK_TIME_DIFF, BLOCK_REWARD,
    BC_NAME, BC_NAME_PUB,
    GEN_PREV_HASH, BLOCK_WINDOW, 
    MIN_DIFFICULTY, MAX_DIFFICULTY, 
    BlockHeader, print 
};