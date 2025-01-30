import { hash_tostr } from '../utils/crypto';

function proof_of_work(block_data_str: string, mining_difficulty: number): { hash: string, n_nonce: number } {
    let n_nonce = 0;
    let hash: string;

    while (true) {
        hash = hash_tostr(block_data_str + n_nonce.toString()); 
        if (hash.substring(0, mining_difficulty) === '0'.repeat(mining_difficulty)) {
            break;
        }

        n_nonce++;
    }
    return { hash, n_nonce };
}


export default proof_of_work;