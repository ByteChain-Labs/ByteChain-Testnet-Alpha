import { hash_tostr } from '../utils/crypto.js';
import { MAX_NONCE_ATTEMPTS } from '../utils/constants.js';

function proof_of_work(block_data_str: string, mining_difficulty: number): { hash: string, n_nonce: number } {
    try {
        let n_nonce = 0;
        let hash: string;

        while (n_nonce < MAX_NONCE_ATTEMPTS) {
            hash = hash_tostr(block_data_str + n_nonce.toString()); 
            if (hash.substring(0, mining_difficulty) === '0'.repeat(mining_difficulty)) {
                return { hash, n_nonce };
            }

            n_nonce++;
        }

        throw new Error(`Could not find a valid hash within: ${MAX_NONCE_ATTEMPTS}`);
    } catch (err) {
        throw new Error('Unable to generate a valid proof')
    }
}


export default proof_of_work;