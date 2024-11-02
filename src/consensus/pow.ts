import { HashBlock }  from '../utils/crypto';

function ProofOfWork(blockDataAsString: string, MiningDifficulty: number): { hash: string, nonce: number } {
    let nonce = 0;
    let hash: string;
    while (true) {
        hash = HashBlock(blockDataAsString + nonce); 
        if (hash.substring(0, MiningDifficulty) === '0'.repeat(MiningDifficulty)) {
        break;
        }
        nonce++;
    }
    return { hash, nonce };
}


export default ProofOfWork;