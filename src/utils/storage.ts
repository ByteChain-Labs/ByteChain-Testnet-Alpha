import fs from "fs";
import path from "path";
import Block from "../core/block.js";
import Transaction from "../core/transaction.js";

const DATA_DIR = "data2";
const CHAIN_FILE = path.join(DATA_DIR, "chain.json");
const CHAIN_TMP_FILE = path.join(DATA_DIR, "chain.json.tmp");

interface AccState {
    nonce: number;
    balance: number;
}

interface PersistedState {
    chain: any[];
    addr_state: [string, AccState][];
    difficulty: number;
}

function ensure_data_dir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function save_state(chain: Block[], addr_state: Map<string, AccState>, difficulty: number) {
    ensure_data_dir();

    const state: PersistedState = {
        chain,
        addr_state: Array.from(addr_state.entries()),
        difficulty,
    };

    fs.writeFileSync(CHAIN_TMP_FILE, JSON.stringify(state));
    fs.renameSync(CHAIN_TMP_FILE, CHAIN_FILE);
}

function rehydrate_tx(data: any): Transaction {
    return new Transaction(data.amount, data.sender, data.recipient, data.fee, data.timestamp, data.nonce, data.signature);
}

function rehydrate_block(data: any): Block {
    const transactions = data.transactions.map(rehydrate_tx);
    const block = new Block(
        data.block_header.block_height,
        data.block_header.difficulty,
        data.block_header.prev_block_hash,
        transactions
    );
    
    block.block_header = { ...data.block_header };
    return block;
}

function load_state(): { chain: Block[]; addr_state: Map<string, AccState>; difficulty: number } | null {
    if (!fs.existsSync(CHAIN_FILE)) return null;

    try {
        const raw = fs.readFileSync(CHAIN_FILE, "utf-8");
        const parsed: PersistedState = JSON.parse(raw);

        return {
            chain: parsed.chain.map(rehydrate_block),
            addr_state: new Map(parsed.addr_state),
            difficulty: parsed.difficulty,
        };
    } catch (err) {
        console.error("Failed to load persisted chain, starting fresh:", err);
        return null;
    }
}

export { save_state, load_state };