import crypto from 'crypto';

// Take a buffer as input an return a buffer as output
function hash_func(data: Buffer): Buffer {
    const hashed_data = crypto.createHash('sha256').update(
        crypto.createHash('sha256').update(data).digest()
    ).digest();

    return hashed_data;
}

// Take a str as input an return a str as output
function hash_block(data: string): string {
    if (typeof data !== 'string') {
        throw new TypeError('Data must be a string.');
    }
    const hashed_data = crypto.createHash('sha256').update(
        crypto.createHash('sha256').update(data).digest('hex')
    ).digest('hex');

    return hashed_data;
}

// Take a str as input an return a buffer as output
function hash_transaction(trx_data_str: string): Buffer {
    const hex_buffer: Buffer = Buffer.from(trx_data_str, 'hex');
    const hashed_transaction = hash_func(hex_buffer);
    
    return hashed_transaction;
}


export { hash_func, hash_block, hash_transaction };