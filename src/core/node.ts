import os from 'os';
import Account from '../accounts/account';
import P2PNode from '../network/p2p';
import Block from './block';

class BCNode {
    port: number;
    ipAddr: string | undefined;

    constructor(port: number) {
        this.port = port;
        this.ipAddr = this.GetIPAddress()
    }

    StartNode() {
        const p2p = new P2PNode(this.port)
        p2p.Start()
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

    SignBlock(block: Block, privKey: Account['privateKey']): string {
        return 'Todo'
    }
    

    CalculateBalance(blockchainAddress: Account['blockchainAddress']): number { return 20; };
}


export default BCNode;