import type { PubKey } from "bc-web3js";
import {
    BLOCK_REWARD, BLOCK_TIME_DIFF,
    MIN_DIFFICULTY, MAX_DIFFICULTY,
    BLOCK_WINDOW_DIFF, BLOCK_WINDOW_FEE,
    BC_NAME, GEN_PREV_HASH, GENESIS_TIMESTAMP,
    VANITY_ADDR, print,
} from "../utils/constants.js";
import { save_state, load_state } from "../utils/storage.js";
import { hash_tostr } from "../utils/crypto.js";
import calc_merkleroot from "./merkleroot.js";
import Transaction from "./transaction.js";
import Block from "./block.js";

interface AccState {
    nonce: number;
    balance: number;
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
        if (persisted?.chain?.length) {
            this.chain = persisted.chain;
            const canonical_genesis = this.genesis_block();
            const stored_genesis = this.chain[0];
            const genesis_matches =
                stored_genesis.block_header.block_height === 0 &&
                stored_genesis.block_header.block_hash === canonical_genesis.block_header.block_hash;

            if (!genesis_matches) {
                if (
                    this.chain.length === 1 &&
                    stored_genesis.block_header.block_height === 0 &&
                    stored_genesis.transactions.length === 0
                ) {
                    this.chain = [canonical_genesis];
                } else {
                    throw new Error(
                        "Persisted chain uses a non-canonical genesis block. Back up the data directory and explicitly migrate/reset this old chain before joining the updated network."
                    );
                }
            }

            this.difficulty = persisted.difficulty ?? MIN_DIFFICULTY;
            print(`Restored chain from disk: ${this.chain.length} block(s).`);
        } else {
            this.chain = [this.genesis_block()];
            this.difficulty = MIN_DIFFICULTY;
            print("Created genesis block.");
        }

        this.addr_state = this.rebuild_account_state(this.chain);
        this.difficulty = this.rebuild_next_difficulty(this.chain);
        this.rebuild_index();
        save_state(this.chain, this.addr_state, this.difficulty);
    }

    genesis_block(): Block {
        const genesis = new Block(0, MIN_DIFFICULTY, GEN_PREV_HASH, []);
        genesis.set_block_props(GENESIS_TIMESTAMP);
        return genesis;
    }

    private get_or_create_state(state: Map<PubKey, AccState>, addr: PubKey): AccState {
        let account = state.get(addr);
        if (!account) {
            account = { nonce: 0, balance: 0 };
            state.set(addr, account);
        }
        return account;
    }

    private clone_state(source: Map<PubKey, AccState>): Map<PubKey, AccState> {
        return new Map(
            [...source.entries()].map(([addr, account]) => [addr, { ...account }])
        );
    }

    private rebuild_account_state(chain: Block[]): Map<PubKey, AccState> {
        const state = new Map<PubKey, AccState>();

        for (let height = 1; height < chain.length; height++) {
            for (const tx of chain[height].transactions) {
                if (tx.sender !== BC_NAME) {
                    const sender = this.get_or_create_state(state, tx.sender);
                    sender.nonce += 1;
                    sender.balance -= tx.amount + tx.fee;
                } else {
                    this.get_or_create_state(state, tx.sender).nonce += 1;
                }

                this.get_or_create_state(state, tx.recipient).balance += tx.amount;
            }
        }

        return state;
    }

    ensure_account(addr: PubKey) {
        this.get_or_create_state(this.addr_state, addr);
    }

    get_nonce(addr: PubKey): number {
        return this.get_or_create_state(this.addr_state, addr).nonce;
    }

    get_balance(addr: PubKey): number {
        return this.get_or_create_state(this.addr_state, addr).balance;
    }

    update_nonce(addr: PubKey) {
        this.get_or_create_state(this.addr_state, addr).nonce += 1;
    }

    credit_addr(addr: PubKey, amount: number) {
        this.get_or_create_state(this.addr_state, addr).balance += amount;
    }

    debit_addr(addr: PubKey, amount: number) {
        const account = this.get_or_create_state(this.addr_state, addr);
        if (account.balance < amount) throw new Error("Insufficient balance");
        account.balance -= amount;
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
        return [...refs].reverse().slice(offset, offset + limit);
    }

    get_tx_from_block(block_height: number, tx_id: string): Transaction | undefined {
        return this.chain[block_height]?.transactions.find(tx => tx.tx_id === tx_id);
    }

    get_latest_block(): Block {
        const last = this.chain[this.chain.length - 1];
        if (!last) throw new Error("Chain is empty: genesis block is missing");
        return last;
    }

    get_multiple_blocks(start: number, end: number): Block[] {
        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < 0) {
            throw new Error("start and end must be non-negative integers");
        }
        if (start > end) throw new Error("start must not exceed end");
        if (end > this.chain.length) throw new Error(`end (${end}) exceeds chain length (${this.chain.length})`);
        return this.chain.slice(start, end);
    }

    calculate_dynamic_fee(): number {
        let fee = 0.1;

        if (this.chain.length >= BLOCK_WINDOW_FEE) {
            const recent_blocks = this.get_multiple_blocks(this.chain.length - BLOCK_WINDOW_FEE, this.chain.length);
            if (recent_blocks.length === 0) return 0.05;

            const avg_tx_count = recent_blocks.reduce((sum, block) => sum + block.transactions.length, 0) / recent_blocks.length;
            const dynamic_fee = 0.05 * (1 + avg_tx_count / 100);
            fee = Math.min(dynamic_fee, 0.1);
        }

        return fee;
    }

    private pending_for_sender(sender: PubKey): Transaction[] {
        return this.tx_pool
            .filter(tx => tx.sender === sender)
            .sort((a, b) => a.nonce - b.nonce);
    }

    private revalidate_pending_transactions(pending: Transaction[]): void {
        const confirmedIds = new Set<string>();
        for (const block of this.chain) {
            for (const tx of block.transactions) confirmedIds.add(tx.tx_id);
        }

        this.tx_pool = [];
        for (const tx of pending) {
            if (confirmedIds.has(tx.tx_id)) continue;
            try {
                this.add_new_tx(tx);
            } catch {}
        }
    }

    add_new_tx(tx: Transaction): Transaction {
        const { amount, sender, recipient, fee, nonce, timestamp, signature } = tx;

        if (
            !Number.isFinite(amount) || amount < 0 ||
            typeof sender !== "string" || sender.length === 0 ||
            typeof recipient !== "string" || recipient.length === 0 ||
            !Number.isFinite(fee) || fee < 0 ||
            !Number.isSafeInteger(nonce) || nonce < 1 ||
            !Number.isFinite(timestamp) || typeof signature !== "string"
        ) {
            throw new Error("Transaction data is incomplete or invalid");
        }

        if (sender === BC_NAME) {
            throw new Error("System transactions cannot be submitted to the mempool");
        }
        if (this.tx_pool.some(pending => pending.tx_id === tx.tx_id)) {
            throw new Error("Transaction is already in the mempool");
        }
        if (this.chain.some(block => block.transactions.some(confirmed => confirmed.tx_id === tx.tx_id))) {
            throw new Error("Transaction is already confirmed");
        }

        try {
            if (fee < this.calculate_dynamic_fee()) {
                throw new Error("Fee not valid for current chain operation");
            }
            if (!tx.verify_tx_sig()) throw new Error("Invalid transaction signature");

            const pending = this.pending_for_sender(sender);
            let expected_nonce = this.get_nonce(sender) + 1;
            let reserved = 0;
            for (const pendingTx of pending) {
                if (pendingTx.nonce !== expected_nonce) {
                    throw new Error("Existing mempool transactions have a nonce gap");
                }
                expected_nonce += 1;
                reserved += pendingTx.amount + pendingTx.fee;
            }

            if (nonce !== expected_nonce) throw new Error("Invalid nonce value");
            if (amount + fee > this.get_balance(sender) - reserved) {
                throw new Error("Insufficient available balance");
            }

            this.tx_pool.push(tx);
            return tx;
        } catch (err) {
            throw new Error(`Error adding transaction to tx_pool: ${err instanceof Error ? err.message : err}`);
        }
    }

    add_new_block(): Block {
        const latest = this.get_latest_block();
        const total_fees = this.tx_pool.reduce((sum, tx) => sum + tx.fee, 0);
        const fee_tx = new Transaction(total_fees, BC_NAME, VANITY_ADDR, 0, Date.now(), 0, "");
        return new Block(
            latest.block_header.block_height + 1,
            this.difficulty,
            latest.block_header.block_hash,
            [...this.tx_pool, fee_tx]
        );
    }

    private validate_system_transactions(block: Block): void {
        const transactions = block.transactions;
        if (block.block_header.block_height === 0) return;
        if (transactions.length < 2) throw new Error("Block is missing its reward and fee transactions");

        const ordinary_tx = transactions.slice(0, -2);
        const reward_tx = transactions[transactions.length - 2];
        const fee_tx = transactions[transactions.length - 1];
        const system_count = transactions.filter(tx => tx.sender === BC_NAME).length;
        if (system_count !== 2 || ordinary_tx.some(tx => tx.sender === BC_NAME)) {
            throw new Error("Block contains invalid system transactions");
        }
        if (
            reward_tx.sender !== BC_NAME || reward_tx.amount !== BLOCK_REWARD ||
            reward_tx.fee !== 0 || reward_tx.nonce !== 0 || reward_tx.signature !== "" ||
            fee_tx.sender !== BC_NAME || fee_tx.fee !== 0 || fee_tx.nonce !== 0 ||
            fee_tx.signature !== "" || fee_tx.recipient !== VANITY_ADDR
        ) {
            throw new Error("Block reward or fee transaction is invalid");
        }

        const expectedFees = ordinary_tx.reduce((sum, tx) => sum + tx.fee, 0);
        if (fee_tx.amount !== expectedFees) throw new Error("Block fee payout does not match transaction fees");
    }

    private apply_transactions_to_state(block: Block, source: Map<PubKey, AccState>): Map<PubKey, AccState> {
        block.contain_valid_txs();
        this.validate_system_transactions(block);
        const next_state = this.clone_state(source);

        for (const tx of block.transactions) {
            if (
                !Number.isFinite(tx.amount) || tx.amount < 0 ||
                !Number.isFinite(tx.fee) || tx.fee < 0 ||
                !Number.isSafeInteger(tx.nonce) || tx.nonce < 0 ||
                !Number.isFinite(tx.timestamp) ||
                typeof tx.sender !== "string" || tx.sender.length === 0 ||
                typeof tx.recipient !== "string" || tx.recipient.length === 0
            ) {
                throw new Error(`Invalid transaction fields at block ${block.block_header.block_height}`);
            }

            if (tx.sender !== BC_NAME) {
                const sender = this.get_or_create_state(next_state, tx.sender);
                if (tx.nonce !== sender.nonce + 1) {
                    throw new Error(`Invalid nonce for transaction ${tx.tx_id}`);
                }
                if (sender.balance < tx.amount + tx.fee) {
                    throw new Error(`Insufficient balance for transaction ${tx.tx_id}`);
                }
                sender.balance -= tx.amount + tx.fee;
                sender.nonce += 1;
            } else {
                this.get_or_create_state(next_state, tx.sender).nonce += 1;
            }

            this.get_or_create_state(next_state, tx.recipient).balance += tx.amount;
        }

        return next_state;
    }

    private validate_next_block(
        block: Block,
        previous: Block,
        current_state: Map<PubKey, AccState>,
        expected_difficulty: number,
    ): Map<PubKey, AccState> {
        const header = block.block_header;
        const prev_header = previous.block_header;

        if (header.block_height !== prev_header.block_height + 1) {
            throw new Error("Block height is not contiguous");
        }
        if (header.prev_block_hash !== prev_header.block_hash) {
            throw new Error("Previous block hash does not match the local chain");
        }
        if (header.difficulty !== expected_difficulty || !Number.isInteger(header.difficulty) || header.difficulty < 1 || header.difficulty > 64) {
            throw new Error("Block difficulty is invalid for this chain");
        }
        if (!Number.isSafeInteger(header.nonce) || header.nonce < 0 || !Number.isFinite(header.timestamp)) {
            throw new Error("Block header contains invalid timestamp or nonce");
        }
        if (!Array.isArray(block.transactions)) throw new Error("Block transactions are invalid");
        if (block.transactions.length === 0) throw new Error("Non-genesis blocks cannot be empty");
        if (header.merkleroot !== calc_merkleroot(block.transactions)) {
            throw new Error("Block Merkle root is invalid");
        }

        const computed_hash = hash_tostr(block.get_base_hash_input() + header.nonce.toString());
        if (header.block_hash !== computed_hash) throw new Error("Block hash is invalid");
        if (!header.block_hash.startsWith("0".repeat(header.difficulty))) {
            throw new Error("Block does not satisfy proof of work");
        }

        return this.apply_transactions_to_state(block, current_state);
    }

    private difficulty_after_append(chain: Block[], current_difficulty: number): number {
        if (chain.length < BLOCK_WINDOW_DIFF) return current_difficulty;

        const prev_header = chain[chain.length - BLOCK_WINDOW_DIFF].block_header;
        const latestHeader = chain[chain.length - 1].block_header;
        const timeDiff = latestHeader.timestamp - prev_header.timestamp;

        if (timeDiff < BLOCK_TIME_DIFF) return Math.min(MAX_DIFFICULTY, current_difficulty + 1);
        if (timeDiff > BLOCK_TIME_DIFF) return Math.max(MIN_DIFFICULTY, current_difficulty - 1);
        return current_difficulty;
    }

    private rebuild_next_difficulty(chain: Block[]): number {
        if (chain.length === 0) return MIN_DIFFICULTY;
        let difficulty = chain[0].block_header.difficulty;
        for (let i = 1; i < chain.length; i++) {
            difficulty = this.difficulty_after_append(chain.slice(0, i + 1), difficulty);
        }
        return difficulty;
    }

    mine_block(miner_addr: PubKey): Block {
        try {
            const block = this.add_new_block();
            const reward_tx = new Transaction(BLOCK_REWARD, BC_NAME, miner_addr, 0, Date.now(), 0, "");
            // Keep both system transactions out of the public mempool.
            block.transactions.splice(block.transactions.length - 1, 0, reward_tx);
            block.set_block_props();

            const next_state = this.apply_transactions_to_state(block, this.addr_state);
            this.chain.push(block);
            this.addr_state = next_state;
            this.difficulty = this.difficulty_after_append(this.chain, this.difficulty);

            for (const tx of block.transactions) this.index_tx(tx, block.block_header.block_height);
            this.tx_pool = [];
            save_state(this.chain, this.addr_state, this.difficulty);
            return block;
        } catch (err) {
            throw new Error(`Error mining block: ${err instanceof Error ? err.message : err}`);
        }
    }

    calc_difficulty(): number {
        this.difficulty = this.difficulty_after_append(this.chain, this.difficulty);
        return this.difficulty;
    }

    append_single_block(block: Block): boolean {
        try {
            const pending_before_block = [...this.tx_pool];
            const latest = this.get_latest_block();
            const next_state = this.validate_next_block(block, latest, this.addr_state, this.difficulty);

            this.chain.push(block);
            this.addr_state = next_state;
            this.difficulty = this.difficulty_after_append(this.chain, this.difficulty);

            for (const tx of block.transactions) this.index_tx(tx, block.block_header.block_height);
            this.revalidate_pending_transactions(pending_before_block);

            save_state(this.chain, this.addr_state, this.difficulty);
            return true;
        } catch (err) {
            print(`Rejected block: ${err instanceof Error ? err.message : err}`);
            return false;
        }
    }

    /**
     * Replace the local suffix after a shared ancestor with a longer, fully
     * validated branch. State/index changes are committed only after validation.
     */
    replace_chain_from(common_height: number, replacement_blocks: Block[]): boolean {
        if (!Number.isSafeInteger(common_height) || common_height < 0 || common_height >= this.chain.length) {
            throw new Error("Invalid common ancestor height");
        }
        if (!Array.isArray(replacement_blocks) || replacement_blocks.length === 0) return false;

        const candidate = this.chain.slice(0, common_height + 1).concat(replacement_blocks);
        if (candidate.length <= this.chain.length) return false;
        if (candidate[0].block_header.block_height !== 0) throw new Error("Candidate chain has no genesis block");

        let state = new Map<PubKey, AccState>();
        let expected_difficulty = candidate[0].block_header.difficulty;
        const validated: Block[] = [candidate[0]];

        for (let i = 1; i < candidate.length; i++) {
            state = this.validate_next_block(candidate[i], validated[i - 1], state, expected_difficulty);
            validated.push(candidate[i]);
            expected_difficulty = this.difficulty_after_append(validated, expected_difficulty);
        }

        const old_pending = [...this.tx_pool];
        this.chain = validated;
        this.addr_state = state;
        this.difficulty = expected_difficulty;
        this.rebuild_index();
        this.revalidate_pending_transactions(old_pending);

        save_state(this.chain, this.addr_state, this.difficulty);
        print(`Switched to validated chain at height ${this.get_latest_block().block_header.block_height}.`);
        return true;
    }

    sync_chain(remote_blocks: Block[]): boolean {
        if (!remote_blocks || remote_blocks.length === 0) return true;

        for (const block of remote_blocks) {
            if (!this.append_single_block(block)) {
                print(`Sync error: Failed to apply block at height ${block.block_header.block_height}`);
                return false;
            }
        }
        return true;
    }
}


export default BlockChain;