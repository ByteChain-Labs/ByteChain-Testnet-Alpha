const { hashFunc } = require('./util')

/**
 * Builds a Merkle tree from an array of transactions.
 * @param {Array} transactions - An array of transaction objects.
 * @returns {string} - The Merkle root hash.
 */ 
function buildMerkleTree(transactions) {
    if (!Array.isArray(transactions)) {
        throw new TypeError('Transactions must be an array.');
    }

    if (transactions.length === 0) {
        return '';
    } 

    if (transactions.length === 1) {
        return hashFunc(JSON.stringify(transactions[0]));
    } 

    let hashes = transactions.map(transaction => hashFunc(JSON.stringify(transaction)));

    while (hashes.length > 1) {
        if (hashes.length % 2 !== 0) {
            hashes.push(hashes[hashes.length - 1]);
        }

        let nextLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
            nextLevel.push(hashFunc(hashes[i] + hashes[i + 1]));
        }
        hashes = nextLevel;
    }
    return hashes[0];
}


module.exports = buildMerkleTree;