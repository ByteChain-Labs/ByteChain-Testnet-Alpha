const BLOCK_TIME_DIFF: number = 600; // in milliseconds, 600ms = 0.6 seconds
const BLOCK_REWARD: number = 32;
const BC_NAME: string = "0xByteChain";
const BC_NAME_PUB: string = "0xByteChainPublicKey";
const GEN_PREV_HASH: string = "0x00000000000000000000000000000000ByteChain";
const GEN_CONTRACT_RECIPIENT: string = "0x000000000000000000000000000000000000000BC";

const MIN_DIFFICULTY = 4;
const MAX_DIFFICULTY = 10;

const BLOCK_WINDOW = 3;

enum Tx_Type {
    BYTE_TX = 'byte_tx',
    CONTRACT = 'contract',
    CONTRACT_CALL = 'contract_call'
}

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
    GEN_CONTRACT_RECIPIENT,
    BlockHeader, Tx_Type, print 
};