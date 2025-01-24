import process from "node:process";
import { createLibp2p } from "libp2p";
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { multiaddr } from 'multiaddr'
import { ping } from '@libp2p/ping'
import { mdns } from '@libp2p/mdns'


const create_peer = async () => {
    const node = await createLibp2p({
        addresses: {
            // add a listen address (localhost) to accept TCP connections on a random port
            listen: ['/ip4/127.0.0.1/tcp/0']
        },
        transports: [tcp()],
        streamMuxers: [yamux()],
        connectionEncrypters: [noise()]
    });
}