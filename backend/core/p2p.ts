import Libp2p from 'libp2p';
import TCP from 'libp2p-tcp';
import Mplex from 'libp2p-mplex';
import { NOISE } from 'libp2p-noise';
import MDNS from 'libp2p-mdns';
import { createFromJSON } from 'peer-id';
import { fromString as uint8ArrayFromString, toString as uint8ArrayToString } from 'uint8arrays';

class P2PNetwork {
    node: Libp2p | null = null;

    async StartNode(privKey: string, pubKey: string, id: string) {
        const peerId = createFromJSON({
            id: id,
            privKey: privKey,
            pubKey: pubKey
        });

        this.node = await Libp2p.create({
            addresses: {
                listen: ['/ip4/0.0.0.0/tcp/0'], // Bind to all interfaces
            },
            modules: {
                transport: [TCP],
                streamMuxer: [Mplex],
                connEncryption: [NOISE],
                peerDiscovery: [MDNS], // Peer discovery via mDNS
            },
            config: {
                peerDiscovery: {
                    autoDial: true,
                    [MDNS.tag]: {
                        enabled: true,
                        interval: 1000,
                    },
                },
            },
            peerId: peerId,
        });

        await this.node.start();
        console.log(`P2P node started with ID: ${this.node.peerId.toB58String()}`);
    }

    async ConnectToPeer(peerId: string) {
        if (!this.node) throw new Error("P2P node is not started");
        try {
            await this.node.dial(peerId);
            console.log(`Connected to peer: ${peerId}`);
        } catch (error) {
            console.error(`Failed to connect to peer: ${(error as Error).message}`);
        }
    }

    async SendMessage(peerId: string, message: string) {
        if (!this.node) throw new Error("P2P node is not started");
        try {
            const { stream } = await this.node.dialProtocol(peerId, '/chat/1.0.0');
            await stream.write(uint8ArrayFromString(message));
            await stream.close();
            console.log(`Message sent to ${peerId}: ${message}`);
        } catch (error) {
            console.error(`Failed to send message: ${(error as Error).message}`);
        }
    }

    HandleMessages() {
        if (!this.node) throw new Error("P2P node is not started");

        this.node.handle('/chat/1.0.0', async ({ stream }) => {
            let data = '';

            for await (const chunk of stream.source) {
                data += uint8ArrayToString(chunk);
            }

            console.log(`Received message: ${data}`);
        });
    }
}

export default P2PNetwork;
