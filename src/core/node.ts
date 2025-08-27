import fs from 'fs'
import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import P2PNode from "../network/p2p.js";
import BlockChain from "./blockchain.js";
import Transaction from "./transaction.js";
import { print, Tx_Type } from '../utils/constants.js';
import Account from '../accounts/account.js';


function read_file() {
    try {
        const file_path = 'bc-setup.json';
        const bc_setup = fs.readFileSync(file_path, 'utf-8');
        const bc_setup_obj = JSON.parse(bc_setup);
        const miner_addr = bc_setup_obj.blockchain_addr;
        const p2p_port = bc_setup_obj.p2p_port;
        const api_port = bc_setup_obj.api_port;

        return { miner_addr, p2p_port, api_port };
    } catch (err) {
        throw new Error("Unable to read data from bc-setup.json");
    }
}

class BCNode {
    private p2p_port: number;
    private api_port: number;
    private miner_addr: string;
    private bytechain: BlockChain;
    private p2p: P2PNode;
    private app: express.Application;

    constructor() {
        this.p2p_port = read_file().p2p_port;
        this.api_port = read_file().api_port;
        this.miner_addr = read_file().miner_addr;
        this.bytechain = new BlockChain();
        this.p2p = new P2PNode(this.bytechain)
        this.app = express();
        this.setup_api_endpoints();
    }

    private setup_api_endpoints() {
        this.app.use(cors());
        this.app.use(express.json());

        this.app.get('/new-account', (_: Request, res: Response) => {
            const { priv_key, pub_key, blockchain_addr} = Account.new();
            res.status(200).json({ priv_key, pub_key, blockchain_addr })
        })

        this.app.post('/tx/send', async (req: Request, res: Response) => {
            try {
                const tx_data = req.body;

                if (tx_data.type === Tx_Type.CONTRACT) {
                    const new_ctx = new Transaction(
                        tx_data.amount,
                        tx_data.sender,
                        tx_data.recipient,
                        tx_data.type,
                        tx_data.timestamp,
                        tx_data.publicKey,
                        tx_data.signature,
                        tx_data.nonce,
                        tx_data.bytecode,
                    );

                    const tx_result = this.bytechain.add_new_tx(new_ctx);
                    if (tx_result) {
                        this.p2p.publishTransaction(new_ctx);
                        return res.status(200).json({ status: 'success', msg: 'Transaction added successfully.' });
                    } else {
                        return res.status(200).json({ status: 'error', msg: 'Failed to add transaction. Invalid or Insufficient fund' });
                    }
                } else if (tx_data.type === Tx_Type.CONTRACT_CALL) {
                    const new_cctx = new Transaction(
                        tx_data.amount,
                        tx_data.sender,
                        tx_data.recipient,
                        tx_data.type,
                        tx_data.timestamp,
                        tx_data.publicKey,
                        tx_data.signature,
                        tx_data.nonce,
                        tx_data.contract_addr,
                    );

                    const tx_result = this.bytechain.add_new_tx(new_cctx);
                    if (tx_result) {
                        this.p2p.publishTransaction(new_cctx);
                        return res.status(200).json({ status: 'success', msg: 'Transaction added successfully.' });
                    } else {
                        return res.status(200).json({ status: 'error', msg: 'Failed to add transaction. Invalid or Insufficient fund' });
                    }
                } else {
                    const new_btx = new Transaction(
                        tx_data.amount,
                        tx_data.sender,
                        tx_data.recipient,
                        tx_data.type,
                        tx_data.timestamp,
                        tx_data.publicKey,
                        tx_data.signature,
                        tx_data.nonce
                    );

                    const tx_result = this.bytechain.add_new_tx(new_btx);
                    if (tx_result) {
                        this.p2p.publishTransaction(new_btx);
                        return res.status(200).json({ status: 'success', msg: 'Transaction added successfully.' });
                    } else {
                        return res.status(200).json({ status: 'error', msg: 'Failed to add transaction. Invalid or Insufficient fund' });
                    }
                }
            } catch (err: any) {
                console.error(`Error processing /send_tx: ${err}`);
                return res.status(500).json({ status: 'error', msg: 'Internal server error', details: err.message })
            }
        });         

        this.app.get('/balance/:address', (req: Request, res: Response) => {
            const addr = req.params.address;

            const balance = this.bytechain.addr_bal.get(addr)!;
            res.status(200).json({ address: addr, balance });
        });

        this.app.get('/nonce/:address', (req: Request, res: Response) => {
            const addr = req.params.address;

            const nonce = this.bytechain.addr_nonce.get(addr)!;
            res.status(200).json({ address: addr, nonce });
        });

        this.app.get('/chain', (_: Request, res: Response) => {
            res.status(200).json(this.bytechain.chain);
        });

        this.app.get('/chain/:number', (req: Request, res: Response) => {
            const block_num = Number(req.params.number);
            if (
                isNaN(block_num) ||
                !Number.isInteger(block_num) ||
                block_num < 0 ||
                block_num >= this.bytechain.chain.length
            ) {
                return res.status(400).json({ status: 'error', msg: 'Invalid block number' });
            }
            res.status(200).json(this.bytechain.chain[block_num]);
        });

        this.app.get('/tx/pool', (_: Request, res: Response) => {
            res.status(200).json(this.bytechain.tx_pool);
        });

        this.app.get('/status', (_: Request, res: Response) => {
            res.status(200).json({ 
                status: 'running',
                peer_id: this.p2p.node ? this.p2p.node.peerId.toString() : 'N/A',
                p2p_port: this.p2p_port,
                api_port: this.api_port,
                chain_len: this.bytechain.chain.length,
                pending_tx_count: this.bytechain.tx_pool.length
            })
        });
    }

    async start() {
        await this.p2p.start(this.p2p_port);
        await this.p2p.subscribeToTopics();

        this.app.listen(this.api_port, () => {
            print(`ByteChain HTTP server started on port ${this.api_port}`);
        }).on('error', (err: any) => {
            print(`Failed to start HTTP server on port ${this.api_port}`);
            process.exit(1);
        });

        print(`ByteChain P2P Node started with peer ID: ${this.p2p.node.peerId.toString()}`);
        print(`Listening on: ${this.p2p.node.getMultiaddrs().map((ma: any) => ma.toString())}`);
    }

    async stop() {
        await this.p2p.stop();
        print('P2P and HTTP server stopped')
    }

    pubTx(tx: Transaction) {
        const result = this.bytechain.add_new_tx(tx);
        if (result) {
            this.p2p.publishTransaction(tx);
        } else {
            console.error('Failed to add transaction to tx_pool.');
        }
    }

    pubBlock() {
        try {
            const new_block = this.bytechain.mine_block(this.miner_addr);
            if (new_block) {
                this.p2p.publishBlock(new_block);
            } else {
                console.error('Failed to mine block.');
            }
        } catch (err: any) {
            console.error(`Exception during block mining: ${err.message || err}`);
        }
    }
}


export default BCNode;