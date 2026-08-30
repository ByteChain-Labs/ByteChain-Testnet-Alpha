import fs from "fs";
import type { PubKey } from "bc-web3js";
import {
    BLOCK_REWARD, BLOCK_TIME_DIFF,
    MIN_DIFFICULTY, MAX_DIFFICULTY,
    BLOCK_WINDOW_DIFF, BLOCK_WINDOW_FEE,
    GEN_PREV_HASH, BC_NAME,
    VANITY_ADDR, print,
    GENESIS_TIMESTAMP
} from "../utils/constants.js";
import { save_state, load_state } from "../utils/storage.js";
import Transaction from "./transaction.js";
import Block from "./block.js";




function read_gen_file(): Block {
    try {
        const file_path = "genesis_block.json";
        const genesis_block = fs.readFileSync(file_path, "utf-8");
        const genesis_block_obj: Block = JSON.parse(genesis_block);

        return genesis_block_obj;
    } catch (err) {
        throw new Error("Unable to read data from genesis_block.json");
    }
}


// The state of an account after an account has interacted with the blockchain, 
// either by sending and receiving.
interface AccState {
    nonce: number,
    balance: number,
}

interface AddrTxRef {
    tx_id: string;
    block_height: number;
    role: "sent" | "received";
}

class BlockChain {
    tx_pool: Transaction[];
    chain: Block[];
    difficulty: number = MIN_DIFFICULTY;
    addr_state: Map<PubKey, AccState> = new Map<PubKey, AccState>();
    addr_tx_index: Map<PubKey, AddrTxRef[]> = new Map();

    constructor() {
        this.tx_pool = [];

        const persisted = load_state();
        if (persisted) {
            this.chain = persisted.chain;
            this.addr_state = persisted.addr_state;
            this.difficulty = persisted.difficulty;
            print(`Restored chain from disk: ${this.chain.length} block(s).`);
        } else {
            this.chain = [];
            this.genesis_block();
            save_state(this.chain, this.addr_state, this.difficulty);
        }

        this.rebuild_index();
    }

    genesis_block() {
        const gen_block = read_gen_file();

        for (const transaction of gen_block.transactions) {
            const tx = new Transaction(
                transaction.amount,
                BC_NAME,
                transaction.recipient,
                transaction.fee,
                transaction.timestamp,
                transaction.nonce,
                ""
            )

            this.tx_pool.push(tx);
            this.credit_addr(transaction.recipient, transaction.amount);
        }
        
        const txs = this.tx_pool;
        const new_block = new Block(0, MIN_DIFFICULTY, GEN_PREV_HASH, txs);
        new_block.set_block_props(GENESIS_TIMESTAMP);

        this.chain.push(new_block);
        this.tx_pool = [];
        this.difficulty = this.calc_difficulty();
    }

    ensure_account(addr: PubKey) {
        if (!this.addr_state.has(addr)) {
            this.addr_state.set(addr, { nonce: 0, balance: 0 });
        }
    }

    get_nonce(addr: PubKey) {
        this.ensure_account(addr);
        const state = this.addr_state.get(addr)!;
        return state.nonce;
    }

    get_balance(addr: PubKey) {
        this.ensure_account(addr);
        const state = this.addr_state.get(addr)!;
        return state.balance;
    }

    update_nonce(addr: PubKey) {
        this.ensure_account(addr);
        const state = this.addr_state.get(addr)!;
        state.nonce += 1;
    }

    credit_addr(addr: PubKey, amount: number) {
        this.ensure_account(addr);
        const state = this.addr_state.get(addr)!;
        state.balance += amount;
    }

    debit_addr(addr: PubKey, amount: number) {
        this.ensure_account(addr);
        const state = this.addr_state.get(addr)!;
        if (state.balance < amount) throw new Error("Insufficient balance");
        state.balance -= amount;
    }

    private index_tx(tx: Transaction, block_height: number) {
        this.push_index_entry(tx.sender, { tx_id: tx.tx_id, block_height, role: "sent" });
        this.push_index_entry(tx.recipient, { tx_id: tx.tx_id, block_height, role: "received" });
    }

    private push_index_entry(addr: PubKey, ref: AddrTxRef) {
        if (!this.addr_tx_index.has(addr)) this.addr_tx_index.set(addr, []);
        this.addr_tx_index.get(addr)!.push(ref);
    }

    private rebuild_index() {
        this.addr_tx_index = new Map();
        for (const block of this.chain) {
            for (const tx of block.transactions) {
                this.index_tx(tx, block.block_header.block_height);
            }
        }
    }

    get_txs_for_addr(addr: PubKey, limit = 50, offset = 0): AddrTxRef[] {
        const refs = this.addr_tx_index.get(addr) || [];
        return [...refs].reverse().slice(offset, offset + limit); // most recent first
    }

    get_tx_from_block(block_height: number, tx_id: string): Transaction | undefined {
        return this.chain[block_height]?.transactions.find(tx => tx.tx_id === tx_id);
    }

    get_latest_block(): Block {
        const last_block = this.chain[this.chain.length - 1];
        return last_block;
    }

    get_multiple_blocks(start: number, end: number): Block[] {
        if (start < 0 || end < 0) {
            throw new Error("start and end must be non-negative");
        }

        if (start >= end) {
            throw new Error("start must be less than end");
        }

        if (end > this.chain.length) {
            throw new Error(`end (${end}) exceeds chain length (${this.chain.length})`);
        }

        let latest_blocks: Block[] = [];
        for (let c = start; c < end; c++) {
            latest_blocks.push(this.chain[c]);
        }

        return latest_blocks;
    }

    calculate_dynamic_fee() {
        let fee = 0.1;

        if (this.chain.length >= BLOCK_WINDOW_FEE) {
            const recent_blocks = this.get_multiple_blocks(this.chain.length - BLOCK_WINDOW_FEE, this.chain.length);

            if (recent_blocks.length === 0) return 0.05;
            
            const avg_tx_count = recent_blocks.reduce((sum, b) => sum + b.transactions.length, 0) / recent_blocks.length;
            const base_fee = 0.05;
            const congestion_factor = avg_tx_count / 100;
            const dynamic_fee = base_fee * (1 + congestion_factor);

            fee = Math.min(dynamic_fee, fee);
        }

        return fee;
    }

    add_new_tx(tx: Transaction): Transaction {
        const { amount, sender, recipient, fee, nonce } = tx;
     
        if (amount === undefined || !sender || !recipient || fee === undefined || nonce === undefined) {
            throw new Error('Transaction data is incomplete')
        }

        try {
            if (sender === BC_NAME) {
                this.tx_pool.push(tx);
                return tx;
            }

            if(amount < 0 || amount > this.get_balance(sender)) throw new Error("Invalid amount");

            if (fee < this.calculate_dynamic_fee()) throw new Error("Fee not valid for current chain operation");

            if (nonce !== this.get_nonce(sender) + 1) throw new Error("Invalid nonce value");

            if (!tx.verify_tx_sig()) throw new Error("Invalid Transaction signature");
            
            this.tx_pool.push(tx);
            this.debit_addr(tx.sender, tx.amount + tx.fee);

            return tx;
        } catch (err) {
            throw new Error(`Error adding transaction to tx_pool: ${(err instanceof Error) ? err.message : err}`);
        }
    }

    add_new_block(): Block {
        try {
            const { block_height, block_hash } = this.get_latest_block().block_header;
            let t_fee = 0;

            for (const tx of this.tx_pool) t_fee += tx.fee;

            const fee_tx = new Transaction(t_fee, BC_NAME, VANITY_ADDR, 0, Date.now(), 0, "");
            this.tx_pool.push(fee_tx);

            const transactions = [...this.tx_pool];
            const block = new Block(block_height + 1, this.difficulty, block_hash, transactions);
            return block;
        } catch (err) {
            throw new Error(`Unable to add a new block to the chain: ${err instanceof Error ? err.message : err}`);
        }
    }

    mine_block(miner_addr: PubKey): Block {
        try {
            const reward_tx = new Transaction(BLOCK_REWARD, BC_NAME, miner_addr, 0, Date.now(), 0, "");

            this.tx_pool.push(reward_tx);

            const new_block = this.add_new_block();
            new_block.set_block_props();

            for (const tx of new_block.transactions) {
                this.update_nonce(tx.sender);
                this.credit_addr(tx.recipient, tx.amount);
            }

            this.chain.push(new_block);
            this.difficulty = this.calc_difficulty();

            for (const tx of new_block.transactions) {
                this.index_tx(tx, new_block.block_header.block_height);
            }

            save_state(this.chain, this.addr_state, this.difficulty);
            this.tx_pool = [];
            
            return new_block;
        } catch (err) {
            throw new Error(`Error mining block: ${err instanceof Error ? err.message : err}`);
        }
    }

    calc_difficulty(): number {
        try {
            if (this.chain.length < BLOCK_WINDOW_DIFF) {
                return this.difficulty;
            }

            const prev_block_header = this.chain[this.chain.length - BLOCK_WINDOW_DIFF].block_header;
            const n_block_header = this.get_latest_block().block_header;
            const time_diff = n_block_header.timestamp - prev_block_header.timestamp;

            if (time_diff < BLOCK_TIME_DIFF) {
                this.difficulty = Math.min(MAX_DIFFICULTY, this.difficulty + 1);
            } else if (time_diff > BLOCK_TIME_DIFF) {
                this.difficulty = Math.max(MIN_DIFFICULTY, this.difficulty - 1);
            }

            return this.difficulty;
        } catch (err) {
            throw new Error(`Error calculating difficulty: ${err instanceof Error ? err.message : err}`);
        }
    }

    static is_valid_chain(chain: Block[]): boolean {
        for (const block of chain) {
            block.contain_valid_txs();
        }
        return true;
    }

    sync_chain(remote: Block[]) {
        if (remote.length <= this.chain.length) return;

        BlockChain.is_valid_chain(remote);

        for (const block of remote) {
            for (const tx of block.transactions) {
                if (tx.sender !== BC_NAME) {
                    this.debit_addr(tx.sender, tx.amount + tx.fee);
                }
                this.update_nonce(tx.sender);
                this.credit_addr(tx.recipient, tx.amount);
            }
            this.chain.push(block);
        }

        this.difficulty = this.calc_difficulty();
        this.tx_pool = [];
        this.rebuild_index();
        save_state(this.chain, this.addr_state, this.difficulty);
    }
}


export default BlockChain;