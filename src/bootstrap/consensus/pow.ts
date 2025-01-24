import { hash_block } from '../../utils/crypto';

function proof_of_work(block_data_str: string, mining_difficulty: number): { hash: string, nonce: number } {
    let nonce = 0;
    let hash: string;
    while (true) {
        hash = hash_block(block_data_str + nonce); 
        if (hash.substring(0, mining_difficulty) === '0'.repeat(mining_difficulty)) {
        break;
        }
        nonce++;
    }
    return { hash, nonce };
}


export default proof_of_work;