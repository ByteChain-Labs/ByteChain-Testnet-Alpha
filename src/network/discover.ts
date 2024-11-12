/*
    Create a mechanism to allow tcp servers and clients to discover each other on the bytechain 
    without using bootstrap nodes
*/

import dgram from 'dgram';
import crypto from 'crypto';
import Account from '../accounts/account'

function SignAdvertisement(message: string, privKey: Account['privateKey']) {
    const sign = crypto.createSign('SHA256');
    sign.update(message);
    const signature = sign.sign(privKey, 'hex');
    
    return signature;
}

function VerifyAdvertisement(message: string, signature: string, pubKey: Account['publicKey']) {
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    
    return verify.verify(pubKey, signature, 'hex');
}

const AdvertiseNode = (privKey: Account['privateKey']) => {
    const broadcaster = dgram.createSocket('udp4');
    const address = '239.255.255.250';
    const port = 41234;

    broadcaster.bind(port, () => {
        broadcaster.setBroadcast(true);
        broadcaster.setMulticastTTL(128);
        broadcaster.addMembership(address);

        const nodeType = 'ByteChainNode';
        const networkID = 'bytechain';
        const message = JSON.stringify({ nodeType, networkID });
        const signature = SignAdvertisement(message, privKey);

        const packet = JSON.stringify({ message, signature });

        broadcaster.send(packet, 0, packet.length, port, address, (err) => {
            if (err) console.error('Failed to broadcast:', err);
            else console.log('Advertisement sent.');
        });
    });
};

const ListenForNodes = (pubKey: Account['publicKey']) => {
    const receiver = dgram.createSocket('udp4');
    receiver.on('message', (msg, rinfo) => {
        const { message, signature } = JSON.parse(msg.toString());
        const { nodeType, networkID } = JSON.parse(message);

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
