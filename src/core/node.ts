import fs from 'fs'
import P2PNode from "../network/p2p.js";
import BlockChain from "./blockchain.js";
import Transaction from "./transaction.js";


function read_file() {
    const file_path = 'bcnode-setup.json';
    const bc_setup = fs.readFileSync(file_path, 'utf-8');
    const bc_setup_obj = JSON.parse(bc_setup);
    const miner_addr = bc_setup_obj.blockchain_addr;

    return miner_addr;
}

class BCNode {
    private port: number;
    private miner_addr: string;
    private bytechain: BlockChain;
    private p2p: P2PNode;

    constructor(port: number) {
        this.port = port;
        this.miner_addr = read_file();
        this.bytechain = new BlockChain();
        this.p2p = new P2PNode(this.bytechain)
    }

    start() {
        this.p2p.start(this.port);
    }

    stop() {
        this.p2p.stop();
    }

    pubTx(tx: Transaction) {
        this.bytechain.add_new_tx(tx);
        this.p2p.publishTransaction(tx);
    }

    pubBlock() {
        const new_block = this.bytechain.mine_block(this.miner_addr);
        this.p2p.publishBlock(new_block);
    }
}


export default BCNode;