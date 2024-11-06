import os from 'os';
import Account from '../accounts/account';
import P2PNode from '../network/p2p';
import BlockChain from './blockchain';

class BCNode {
    port: number;
    ipAddr: string | undefined;
    blockchain: BlockChain

    constructor(port: number) {
        this.port = port;
        this.ipAddr = this.GetIPAddress();
        this.blockchain = new BlockChain();
    }

    GetIPAddress(): string | undefined {
        const interfaces = os.networkInterfaces();
        const addresses = [];
    
        for (const name in interfaces) {
            for (const iface of interfaces[name] ?? []) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    addresses.push(iface.address);
                }
            }
        }
    
        return addresses[0];
    }
}


export default BCNode;