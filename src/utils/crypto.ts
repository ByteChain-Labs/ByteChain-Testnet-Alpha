import crypto from 'crypto';

function HashFunc(data: Buffer): Buffer {
    const hashedData = crypto.createHash('sha256').update(
        crypto.createHash('sha256').update(data).digest()
    ).digest();
    return hashedData;
}

function HashBlock(data: string): string {
    if (typeof data !== 'string') {
        throw new TypeError('Data must be a string.');
    }
    const hashedData = crypto.createHash('sha256').update(
        crypto.createHash('sha256').update(data).digest('hex')
    ).digest('hex');
    return hashedData;
}

function HashTransaction(trxDataAsStr: string): Buffer {
    const hexBuffer: Buffer = Buffer.from(trxDataAsStr, 'hex');
    const hashedTransaction = HashFunc(hexBuffer);
    
    return hashedTransaction;
}


export { HashFunc, HashBlock, HashTransaction };