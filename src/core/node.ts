import fs from 'fs'
import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import P2PNode from "../network/p2p.js";
import BlockChain from "./blockchain.js";
import Transaction from "./transaction.js";
import { print } from '../utils/core_constants.js';
import Account from '../accounts/account.js';


function read_file() {
    const file_path = 'bcnode-setup.json';
    const bc_setup = fs.readFileSync(file_path, 'utf-8');
    const bc_setup_obj = JSON.parse(bc_setup);
    const miner_addr = bc_setup_obj.blockchain_addr;

    return miner_addr;
}

class BCNode {
    private p2p_port: number;
    private api_port: number;
    private miner_addr: string;
    private bytechain: BlockChain;
    private p2p: P2PNode;
    private app: express.Application;

    constructor(p2p_port: number, api_port: number) {
        this.p2p_port = p2p_port;
        this.api_port = api_port;
        this.miner_addr = read_file();
        this.bytechain = new BlockChain();
        this.p2p = new P2PNode(this.bytechain)
        this.app = express();
        this.setup_api_endpoints();
    }

    private setup_api_endpoints() {
        this.app.use(cors());
        this.app.use(express.json());

        this.app.get('/new_acc', (_: Request, res: Response) => {
            const { priv_key, pub_key, blockchain_addr} = Account.new();
            res.status(200).json({ priv_key, pub_key, blockchain_addr })
        })

        this.app.post('/new_tx', async (req: Request, res: Response) => {
            try {
                const tx_data = req.body;

                const new_tx = new Transaction(
                    tx_data.amount,
                    tx_data.sender,
                    tx_data.recipient,
                    tx_data.type,
                    tx_data.timestamp,
                    tx_data.publicKey,
                    tx_data.signature,
                    tx_data.nonce
                );
                
                const tx_result = this.bytechain.add_new_tx(new_tx);
                if (tx_result) {
                    this.p2p.publishTransaction(new_tx);
                    return res.status(200).json({ status: 'success', msg: 'Transaction added successfully.' });
                } else {
                    return res.status(200).json({ status: 'error', msg: 'Failed to add transaction. Invalid or Insufficient fund' });
                }
            } catch (err: any) {
                console.error(`Error processing /send_tx: ${err}`);
                return res.status(500).json({ status: 'error', msg: 'Internal server error', details: err.message })
            }

        });

        this.app.get('/get_bal/:address', (req: Request, res: Response) => {
            const addr = req.params.address;

            const balance = this.bytechain.addr_bal.get(addr) || 0;
            res.status(200).json({ address: addr, balance });
        });

        this.app.get('/chain', (_: Request, res: Response) => {
            res.status(200).json(this.bytechain.chain);
        });

        this.app.get('/pending_tx', (_: Request, res: Response) => {
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