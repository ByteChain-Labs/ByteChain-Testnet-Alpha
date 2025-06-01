const BlockReward: number = 1024;
const BlockTime: number = 100;

const MIN_DIFFICULTY = 3;
const MAX_DIFFICULTY = 8;

const BLOCK_WINDOW = 4;

const ADDRESS_VERSION_BYTE = 0xBC;
const BYTECHAIN_COIN_TYPE = 188;

interface BlockHeader {
    nonce: number;
    block_height: number;
    timestamp: number;
    merkleroot: string;
    prev_block_hash: string;
    block_hash: string;
    difficulty: number;
}

type TxPlaceHolder = {
    amount: number,
    sender: string,
    recipient: string,
}

const print = (...data: any): void => {
    console.log(...data);
}


export { 
    BlockTime, 
    BlockHeader,
    TxPlaceHolder, 
    BlockReward, 
    ADDRESS_VERSION_BYTE, 
    BYTECHAIN_COIN_TYPE, 
    MIN_DIFFICULTY, 
    MAX_DIFFICULTY, BLOCK_WINDOW, 
    print 
};