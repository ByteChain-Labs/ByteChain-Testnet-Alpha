import crypto from 'node:crypto';

// Take a buffer as input an return a buffer as output
function hash_func(data_buf: Buffer): Buffer {
    const hashed_data = crypto.createHash('sha256').update(
        crypto.createHash('sha256').update(data_buf).digest()
    ).digest();

    return hashed_data;
}

// Take a str as input an return a buffer as output
function hash_tobuf(data_str: string): Buffer {
    if (typeof data_str !== 'string') {
        throw new TypeError('Data must be a string.');
    }

    const hex_buffer: Buffer = Buffer.from(data_str, 'hex');
    const hashed_transaction = hash_func(hex_buffer);
    
    return hashed_transaction;
}

// Take a str as input an return a str as output
function hash_tostr(data_str: string): string {
    if (typeof data_str !== 'string') {
        throw new TypeError('Data must be a string.');
    }
    const hashed_data = crypto.createHash('sha256').update(
        crypto.createHash('sha256').update(data_str).digest('hex')
    ).digest('hex');

    return hashed_data;
}



export { hash_tostr, hash_tobuf };