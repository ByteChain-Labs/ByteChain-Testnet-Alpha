import { hashBlock } from './crypto';
import Transaction from '../core/transaction';

function BuildMerkleTree(transactions: Transaction[]): string {
    if (!Array.isArray(transactions)) {
        throw new TypeError('Transactions must be an array.');
    }

    if (transactions.length === 0) {
        return '';
    } 

    if (transactions.length === 1) {
        return hashBlock(JSON.stringify(transactions[0]));
    } 

    let hashes: string[] = transactions.map(transaction => hashBlock(JSON.stringify(transaction)));

    while (hashes.length > 1) {
        if (hashes.length % 2 !== 0) {
            hashes.push(hashes[hashes.length - 1]);
        }

        let nextLevel: string[] = [];
        for (let i = 0; i < hashes.length; i += 2) {
            nextLevel.push(hashBlock(hashes[i] + hashes[i + 1]));
        }
        hashes = nextLevel;
    }
    return hashes[0];
}

export default BuildMerkleTree;