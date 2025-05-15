import { TxPlaceHolder, BlockReward, BlockTime, MIN_DIFFICULTY, MAX_DIFFICULTY, BLOCK_WINDOW } from "../utils/core_constants";
import Account from "../accounts/account";
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

    add_new_tx(transaction: Transaction, pub_key: string): Transaction {
        const { amount, sender, recipient, signature, nonce } = transaction;
        const get_prev_snonce = this.addr_nonce.get(sender) ?? 0;
        const sender_bal = this.addr_bal.get(sender) ?? 0;

        try {

            if (!amount || !sender || !recipient || !signature || !nonce) {
                console.error("Incomplete transaction detail");
            }

            this.addr_nonce.set(sender, get_prev_snonce + 1);

            if(amount < 0) {
                console.error("Invalid amount");
            }

            if (amount > sender_bal) {
                console.error("Insufficient fund");
            }

            const sender_nonce = this.addr_nonce.get(sender) ?? 0;
            if (nonce !== sender_nonce) {
                console.error("Invalid nonce value");
            }

            if (!transaction.verify_tx_sig(pub_key)) {
                console.error("Invalid Transaction");
            }
            
            this.tx_pool.push(transaction);
            this.addr_bal.set(sender, sender_bal - amount);

            return transaction;
        } catch (err) {
            this.addr_nonce.set(sender, get_prev_snonce + 1);
            this.addr_bal.set(sender, sender_bal - amount);
            throw new Error(`Error adding transaction to tx_pool: ${err}`)
        }
    }

    add_new_block(): Block {
        try {
            const { block_height, block_hash } = this.get_last_block().block_header;
            const n_block_height = block_height + 1;
            const transactions = this.tx_pool;
            const block = new Block(n_block_height, Date.now(), block_hash, transactions);

            for (const transaction of transactions) {
                const { amount,  recipient } = transaction;

                const recipient_bal = Number(this.addr_bal.get(recipient));

                this.addr_bal.set(recipient, recipient_bal + amount)
            }

            this.tx_pool = [];

            return block;
        } catch (err) {
            throw new Error('Unable to add a new block to the chain');
        }
    }

    mine_block(miner_addr: string): Block {
        try {
            const account = new Account();

            const { blockchain_addr, pub_key } = account;

            this.addr_bal.set(blockchain_addr, 1024);

            const reward_placeholder: TxPlaceHolder = { 
                amount: BlockReward, 
                sender: blockchain_addr, 
                recipient: miner_addr,
            }

            const { signature, tx_nonce } = account.sign_tx(reward_placeholder)

            const reward_tx = new Transaction(
                reward_placeholder.amount, 
                reward_placeholder.sender, 
                reward_placeholder.recipient, 
                signature,
                tx_nonce,
            );

            this.add_new_tx(reward_tx, pub_key);

            const new_block = this.add_new_block();
            new_block.set_block_props(this.difficulty);

            this.chain.push(new_block);
            this.difficulty = this.calc_difficulty();

            return new_block;
        } catch (err) {
            throw new Error(`Error mining block: ${err}`);
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

            if (time_diff < BlockTime) {
                this.difficulty = Math.min(MAX_DIFFICULTY, this.difficulty + 1);
            } else if (time_diff > BlockTime) {
                this.difficulty = Math.max(MIN_DIFFICULTY, this.difficulty - 1);
            }

            return this.difficulty;
        } catch (err) {
            console.error('Error calculating difficulty: ', err);
            return MAX_DIFFICULTY;
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