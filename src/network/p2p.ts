import { createLibp2p } from "libp2p/src/index";
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { multiaddr } from "@multiformats/multiaddr";
import { ping } from '@libp2p/ping'
import { mdns } from '@libp2p/mdns'
import { bootstrap } from "@libp2p/bootstrap";
import { kadDHT } from "@libp2p/kad-dht";
import { identify } from "@libp2p/identify";


const create_peer = async () => {
    const node = await createLibp2p({
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        transports: [tcp()],
        streamMuxers: [yamux()],
        connectionEncrypters: [noise()],
        peerDiscovery: [
            mdns(),
            bootstrap({ list: ["/ip4/127.0.0.1/tcp/8080/p2p/0"]})
        ],
        services: {
            dht: kadDHT(),
            identify: identify(),
            ping: ping()
        }

    });

    return node;
}



export default create_peer;