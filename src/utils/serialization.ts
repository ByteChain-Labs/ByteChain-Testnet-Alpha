import Transaction from '../core/transaction.js';
import Block from '../core/block.js';
import { Tx_Type } from './constants.js'

/**
 * Serializes a Transaction object into a plain JavaScript object or JSON string.
 * This is crucial because class instances lose their methods when stringified directly,
 * and need to be reconstructed.
 *
 * @param tx The Transaction object to serialize.
 * @returns A plain object representation of the transaction, or a JSON string.
 */
function serialize_tx(tx: Transaction): Record<string, any> {
    const obj: Record<string, any> = {
        type: tx.type,
        amount: tx.amount,
        sender: tx.sender,
        recipient: tx.recipient,
        signature: tx.signature,
        nonce: tx.nonce,
        timestamp: tx.timestamp,
        publicKey: tx.publicKey,
    };

    if (tx.bytecode !== undefined) {
        obj.bytecode = tx.bytecode;
    }
    if (tx.contract_addr !== undefined) {
        obj.contract_addr = tx.contract_addr;
    }

    return obj;
}

/**
 * Deserializes a plain JavaScript object (or parsed JSON) back into a Transaction object.
 *
 * @param data The plain object (or parsed JSON) representing a transaction.
 * @returns A new Transaction instance.
 * @throws Error if essential transaction data is missing or invalid.
 */
function deserialize_tx(data: Record<string, any>): Transaction {
    if (
        data.type === undefined ||
        data.amount === undefined ||
        data.sender === undefined ||
        data.recipient === undefined ||
        data.signature === undefined ||
        data.nonce === undefined ||
        data.timestamp === undefined ||
        data.publicKey === undefined
    ) {
        throw new Error('Missing essential transaction data during deserialization.');
    }

    if (!Object.values(Tx_Type).includes(data.type)) {
        throw new Error(`Invalid transaction type: ${data.type}`);
    }

    const tx = new Transaction(
        data.amount,
        data.sender,
        data.recipient,
        data.type as Tx_Type,
        data.publicKey,
        data.signature,
        data.nonce,
        data.timestamp,
        data.bytecode,
    );

    return tx;
}

/**
 * Serializes a Block object into a plain JavaScript object.
 * This includes serializing all nested Transaction objects.
 *
 * @param block The Block object to serialize.
 * @returns A plain object representation of the block.
 */
function serialize_block(block: Block): Record<string, any> {
    return {
        block_header: {
            block_height: block.block_header.block_height,
            difficulty: block.block_header.difficulty,
            prev_hash: block.block_header.prev_block_hash,
            timestamp: block.block_header.timestamp,
            nonce: block.block_header.nonce,
            block_hash: block.block_header.block_hash,
            merkle_root: block.block_header.merkleroot,
        },
        transactions: block.transactions.map(tx => serialize_tx(tx)),
    };
}

/**
 * Deserializes a plain JavaScript object (or parsed JSON) back into a Block object.
 * This includes deserializing all nested Transaction objects.
 *
 * @param data The plain object (or parsed JSON) representing a block.
 * @returns A new Block instance.
 * @throws Error if essential block data is missing or invalid.
 */
function deserialize_block(data: Record<string, any>): Block {
    if (!data.block_header ||
        data.block_header.block_height === undefined ||
        data.block_header.difficulty === undefined ||
        data.block_header.prev_hash === undefined ||
        data.block_header.timestamp === undefined ||
        data.block_header.nonce === undefined ||
        data.block_header.block_hash === undefined ||
        data.block_header.merkle_root === undefined ||
        !Array.isArray(data.transactions)
    ) {
        throw new Error('Missing essential block data or invalid transactions array during deserialization.');
    }

    const deserializedTransactions = data.transactions.map((tx_data: Record<string, any>) =>
        deserialize_tx(tx_data)
    );

    const block = new Block(
        data.block_header.block_height,
        data.block_header.difficulty,
        data.block_header.prev_hash,
        deserializedTransactions
    );

    block.block_header.timestamp = data.block_header.timestamp;
    block.block_header.nonce = data.block_header.nonce;
    block.block_header.block_hash = data.block_header.block_hash;
    block.block_header.merkleroot = data.block_header.merkle_root;

    return block;
}

function toJSON(obj: Record<string, any>): string {
    return JSON.stringify(obj);
}

function fromJSON(jsonString: string): Record<string, any> {
    return JSON.parse(jsonString);
}


export { 
    serialize_tx, deserialize_tx,
    serialize_block, deserialize_block,
    toJSON, fromJSON
}