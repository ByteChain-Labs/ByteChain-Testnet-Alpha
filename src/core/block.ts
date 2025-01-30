import { BlockHeader }  from "../utils/core_constants"
import proof_of_work from "../consensus/pow";
import Transaction from "./transaction";
import calc_merkleroot from "./merkleroot";


class Block {
    block_header: BlockHeader;
    transactions: Transaction[];

    constructor(block_height: number, timestamp: number, prev_block_hash: string, transactions: Transaction[]) {
        this.block_header = {
            nonce: 0,
            block_height: block_height,
            timestamp: timestamp,
            merkleroot: "",
            prev_block_hash: prev_block_hash,
            block_hash: "",
        };
        this.transactions = transactions;
    }

    set_block_props(difficulty: number) {
        this.block_header.merkleroot = calc_merkleroot<Transaction>(this.transactions);
        const { nonce, block_height, timestamp, merkleroot,  prev_block_hash } = this.block_header;

        const block_data_str = `${nonce}${block_height}${timestamp}${merkleroot}${prev_block_hash}${this.transactions}`;

        const { n_nonce, hash } = proof_of_work(block_data_str, difficulty);

        this.block_header.nonce = n_nonce;
        this.block_header.block_hash = hash;
    }
}


export default Block;