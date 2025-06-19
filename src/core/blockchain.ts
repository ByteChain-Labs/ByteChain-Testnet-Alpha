import { BLOCK_REWARD, BLOCK_TIME, MIN_DIFFICULTY, MAX_DIFFICULTY, BLOCK_WINDOW, BC_NAME } from "../utils/core_constants";
import Transaction from "./transaction";
import Block from "./block";


class BlockChain {
    tx_pool: Transaction[];
    chain: Block[];
    difficulty: number = 3;
    addr_bal: Map<string, number>;
    addr_nonce: Map<string, number>;

    constructor() {
        this.tx_pool = [];
        this.chain = [];
        this.addr_bal = new Map<string, number>();
        this.addr_nonce = new Map<string, number>();
        this.genesis_block();
    }

    genesis_block() {
        const transaction: Transaction[] = [];
        const a_block = new Block(
            0,
            Date.now(),
            "0x00000000000000000000000000000000ByteChain",
            transaction
        );
        
        a_block.set_block_props(this.difficulty);
        this.chain.push(a_block);
        this.calc_difficulty();

        // Testing by setting this random address to have a balance of 1 billion bytes.
        this.addr_bal.set("2K2NFr5cFUfksGENqtZyx4BdgRvGWq97JAs", 1000000000)
    }

    get_last_block(): Block {
        const last_block = this.chain[this.chain.length - 1];

        return last_block;
    }

    add_new_tx(tx: Transaction, pub_key: string): Transaction {
        try {
            const { amount, sender, recipient, signature, nonce } = tx;
            const prev_nonce = this.addr_nonce.get(sender) ?? 0;
            const sender_bal = this.addr_bal.get(sender) ?? 0;

            if (sender === BC_NAME) {
                if (!amount || !recipient || nonce === undefined) {
                    throw new Error("Incomplete coinbase transaction detail");
                }

                this.tx_pool.push(tx);
                return tx;
            } else {
                if (!amount || !sender || !recipient || !signature || !nonce || nonce === undefined) {
                    throw new Error("Incomplete transaction detail");
                }
                this.addr_nonce.set(sender, prev_nonce + 1);

                if(amount < 0) {
                    throw new Error("Invalid amount");
                }

                if (amount > sender_bal) {
                    throw new Error("Insufficient fund");
                }

                const sender_nonce = this.addr_nonce.get(sender) ?? 0;

                if (nonce !== sender_nonce) {
                    throw new Error("Invalid nonce value");
                }

                if (!tx.verify_tx_sig(pub_key)) {
                    throw new Error("Invalid Transaction");
                }
                
                this.tx_pool.push(tx);
                this.addr_bal.set(sender, sender_bal - amount);
            }

            return tx;
        } catch (err) {
            throw new Error("Error adding transaction to tx_pool");
        }
    }

    add_new_block(): Block {
        try {
            const { block_height, block_hash } = this.get_last_block().block_header;
            const n_block_height = block_height + 1;
            const transactions = this.tx_pool;
            const block = new Block(n_block_height, Date.now(), block_hash, transactions);

            for (const transaction of transactions) {
                const { amount, sender,  recipient } = transaction;
                
                if (sender === BC_NAME) {
                    const recipient_bal = this.addr_bal.get(recipient) ?? 0;
                    this.addr_bal.set(recipient, recipient_bal + amount)
                } else {
                    const recipient_bal = this.addr_bal.get(recipient) ?? 0;
                    this.addr_bal.set(recipient, recipient_bal + amount)
                }
            }

            this.tx_pool = [];

            return block;
        } catch (err) {
            throw new Error('Unable to add a new block to the chain');
        }
    }

    mine_block(miner_addr: string): Block {
        try {
            const reward_tx = new Transaction(BLOCK_REWARD, BC_NAME, miner_addr, "", 0);
            reward_tx.create_tx_id();

            this.add_new_tx(reward_tx, BC_NAME);
            // this.tx_pool.push(reward_tx);

            const new_block = this.add_new_block();
            new_block.set_block_props(this.difficulty);

            this.chain.push(new_block);
            this.difficulty = this.calc_difficulty();

            return new_block;
        } catch (err) {
            throw new Error("Error mining block");
        }
    }

    calc_difficulty(): number {
        try {
            if (this.chain.length < BLOCK_WINDOW) {
                return this.difficulty;
            }

            const prev_block_header = this.chain[this.chain.length - BLOCK_WINDOW].block_header;
            const n_block_header = this.get_last_block().block_header;
            const time_diff = n_block_header.timestamp - prev_block_header.timestamp;

            if (time_diff < BLOCK_TIME) {
                this.difficulty = Math.min(MAX_DIFFICULTY, this.difficulty + 1);
            } else if (time_diff > BLOCK_TIME) {
                this.difficulty = Math.max(MIN_DIFFICULTY, this.difficulty - 1);
            }

            return this.difficulty;
        } catch (err) {
            throw new Error("Error calculating difficulty");
        }
    }

    // Todo implement this methods 
    is_valid_chain(chain: BlockChain['chain']): boolean {
        for (const block_index in chain) {
            const block = chain[block_index];
            const transactions = block.transactions;
            for (let tx_index = 0; tx_index < transactions.length; tx_index += 1) {
                const tx = transactions[tx_index];
                // tx.is_valid_tx();
            }
        }
        return true;
    }

    // sync_chain(local: BlockChain, remote: BlockChain): BlockChain {
    //     return remote || local;
    // }
}


export default BlockChain;