import crypto from 'crypto';

// Take a buffer as input and returns a buffer as output
function hash_func(data_buf: Buffer): Buffer {
    const hashed_data = crypto.createHash('sha256').update(data_buf).digest();

    return hashed_data;
}

// Take a str as input and returns a buffer as output
function hash_tobuf(data_str: string): Buffer {
    if (typeof data_str !== 'string') {
        throw new TypeError('Data must be a string.');
    }

    const hex_buffer: Buffer = Buffer.from(data_str, 'utf8');
    const hashed_transaction = hash_func(hex_buffer);
    
    return hashed_transaction;
}

// Take a str as input and returns a str as output
function hash_tostr(data_str: string): string {
    if (typeof data_str !== 'string') {
        throw new TypeError('Data must be a string.');
    }
    const hashed_data = crypto.createHash('sha256').update(data_str).digest('hex');

    return hashed_data;
}



export { hash_tostr, hash_tobuf };