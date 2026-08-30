const BLOCK_TIME: number = 5000; // 5000ms = 5secs., block mining interval
const BLOCK_TIME_DIFF: number = 20000; // in millisecs, 20000ms = 20 secs., max diff. between timestamp of prev. block
const BLOCK_REWARD: number = 32;
const MAX_NONCE_ATTEMPTS: number = 1_000_000_000_000;
const GENESIS_TIMESTAMP: number = 1735689600000;
const BC_NAME: string = "ByteChain";
const GEN_PREV_HASH: string = "0000000000000000000000000000000000000000000000000000000ByteChain";

const MAX_TIME_DIFF_TX = 10000;
const MIN_DIFFICULTY: number = 4;
const MAX_DIFFICULTY: number = 100;
const BLOCK_WINDOW_DIFF: number = 10; // block window for difficulty
const BLOCK_WINDOW_FEE: number = 10; // block window for fee calculation

const VANITY_ADDR: string = "00000000000000000000000000000000000";

const print = (...data: any): void => {
    console.dir(...data, { depth: null, colors: true });
}


export { 
    BLOCK_TIME, BLOCK_TIME_DIFF, GENESIS_TIMESTAMP,
    BLOCK_REWARD, BC_NAME, MAX_TIME_DIFF_TX,
    VANITY_ADDR, BLOCK_WINDOW_FEE,
    GEN_PREV_HASH, BLOCK_WINDOW_DIFF, 
    MIN_DIFFICULTY, MAX_DIFFICULTY, 
    MAX_NONCE_ATTEMPTS, print
};
