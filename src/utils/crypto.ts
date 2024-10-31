import crypto from 'crypto';

export function hashFunc(data: Buffer): Buffer {
    const hashedData = crypto.createHash('sha256').update(
        crypto.createHash('sha256').update(data).digest()
    ).digest();
    return hashedData;
}

export function hashBlock(data: string): string {
    if (typeof data !== 'string') {
        throw new TypeError('Data must be a string.');
    }
    const hashedData = crypto.createHash('sha256').update(
        crypto.createHash('sha256').update(data).digest('hex')
    ).digest('hex');
    return hashedData;
}

// export function hashTransaction(amount: number, sender: string, recipient: string): string {
//     const transactionDataAsString = `${amount}${sender}${recipient}`;
//     const hashedTransaction = hashBlock(transactionDataAsString);
//     return hashedTransaction;
// }