/*
    Create a mechanism to allow tcp servers and clients to discover each other on the bytechain 
    without using bootstrap nodes
*/

import dgram from 'dgram';
import crypto from 'crypto';
import Account from '../accounts/account'

function SignAdvertisement(message: string, privateKey: string) {
    const sign = crypto.createSign('SHA256');
    sign.update(message);
    const signature = sign.sign(privateKey, 'hex');
    
    return signature;
}

function VerifyAdvertisement(message: string, signature: string, publicKey: string) {
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    
    return verify.verify(publicKey, signature, 'hex');
}

const AdvertiseNode = (privKey: Account['privateKey']) => {
    const broadcaster = dgram.createSocket('udp4');

    broadcaster.bind(41234, () => {
        const info = broadcaster.address();
        const address = '239.255.255.250'; // Example multicast address for wide network
        const port = 41234;
        
        const nodeType = 'ByteChainNode';
        const networkID = 'bytechain';
        const message = JSON.stringify({ nodeType, networkID });
        const signature = SignAdvertisement(message, privKey);

        const packet = JSON.stringify({ message, signature });

        // Broadcasting packet
        broadcaster.send(packet, 0, packet.length, port, address, (err) => {
            if (err) console.error('Failed to broadcast:', err);
            else console.log('Advertisement sent.');
        });
    });
};

const ListenForNodes = (pubKey: Account['publivKey']) => {
    const receiver = dgram.createSocket('udp4');
    receiver.on('message', (msg, rinfo) => {
        const { message, signature } = JSON.parse(msg.toString());
        const { nodeType, networkID } = JSON.parse(message);

        // Validate node type and network ID
        if (nodeType === 'ByteChainNode' && networkID === 'bytechain') {
            const isValid = VerifyAdvertisement(message, signature, pubKey);
            if (isValid) {
                console.log(`Discovered valid ByteChain node at ${rinfo.address}`);
            } else {
                console.log(`Invalid signature from node at ${rinfo.address}`);
            }
        } else {
            console.log(`Rejected node at ${rinfo.address}`);
        }
    });

    receiver.bind(41234);
};


export { SignAdvertisement, VerifyAdvertisement, AdvertiseNode, ListenForNodes };
