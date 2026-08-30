import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export type PubKey = string;
export type PrivKey = string;

// Take bytes as input and return bytes as output
function hash_func(data_buf: Uint8Array): Uint8Array {
    return sha256(data_buf);
}

// Take a str as input and return bytes as output
export function hash_tobuf(data_str: string): Uint8Array {
    if (typeof data_str !== 'string') {
        throw new TypeError('Data must be a string.');
    }

    const encoded = new TextEncoder().encode(data_str);
    return hash_func(encoded);
}

// Take a str as input and return a hex str as output
export function hash_tostr(data_str: string): string {
    const hashed_data = hash_tobuf(data_str);
    return bytesToHex(hashed_data);
}
