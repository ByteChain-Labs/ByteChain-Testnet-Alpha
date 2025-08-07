import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { identify } from '@libp2p/identify';
import { kadDHT } from '@libp2p/kad-dht';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { mdns } from '@libp2p/mdns';
import { ping } from '@libp2p/ping';
import BlockChain from '../core/blockchain.js';
import Block from '../core/block.js';
import Transaction from '../core/transaction.js';

import { serialize_tx, deserialize_tx, serialize_block, deserialize_block } from '../utils/serialization.js';
import { print } from '../utils/core_constants.js';


class P2PNode {
    node: any;
    blockchain: BlockChain;

    constructor(blockchainInstance: BlockChain) {
        this.blockchain = blockchainInstance;
    }

    async start(port: number) {
        this.node = await createLibp2p({
            addresses: {
                listen: [`/ip4/0.0.0.0/tcp/${port}/ws`]
            },
            transports: [
                tcp(),
                webSockets()
            ],
            connectionEncrypters: [noise()],
            streamMuxers: [yamux()],
            peerDiscovery: [mdns()],
            services: {
                identify: identify(),
                ping: ping(),
                dht: kadDHT({
                    clientMode: false,
                }),
                pubsub: gossipsub({
                    allowPublishToZeroTopicPeers: true,
                })
            }
        });

        this.node.addEventListener('peer:discovery', (evt: any) => {
            const peerId = evt.detail.id;
            print(`Discovered peer: ${peerId.toString()}`);
        });

        this.node.addEventListener('peer:connect', (evt: any) => {
            const peerId = evt.detail.id;
            print(`Connected to peer: ${peerId.toString()}`);
        });

        this.node.addEventListener('peer:disconnect', (evt: any) => {
            const peerId = evt.detail.id;
            print(`Disconnected from peer: ${peerId.toString()}`);
        });

        await this.node.start();
    }

    async stop() {
        await this.node.stop();
        print('P2P Node stopped');
    }

    async subscribeToTopics() {
        this.node.services.pubsub.subscribe('bytechain:transactions');
        this.node.services.pubsub.subscribe('bytechain:blocks');

        this.node.services.pubsub.addEventListener('message', (evt: any) => {
            const { topic, data } = evt.detail;
            const messageString = new TextDecoder().decode(data);
            let message: any;

            try {
                message = JSON.parse(messageString);
            } catch (error) {
                console.error('Error parsing JSON message:', error);
                return;
            }

            switch (topic) {
                case 'bytechain:transactions':
                    print(`Received new transaction from peer on topic ${topic}`);
                    try {
                        const receivedTx = deserialize_tx(message);
                        const addResult = this.blockchain.add_new_tx(receivedTx);
                        if (addResult) {
                             print("Peer transaction added to pool.");
                        } else {
                            console.error("Failed to add peer transaction.");
                        }
                    } catch (error: any) {
                        console.error('Error deserializing or processing received transaction:', error.message);
                    }
                    break;
                case 'bytechain:blocks':
                    print(`Received new block from peer on topic ${topic}`);
                    try {
                        const receivedBlock = deserialize_block(message);
                        print(`Received block height: ${receivedBlock.block_header.block_height}, hash: ${receivedBlock.block_header.block_hash}`);
                    } catch (error: any) {
                        console.error('Error deserializing or processing received block:', error.message);
                    }
                    break;
                default:
                    print(`Received message on unknown topic ${topic}`);
            }
        });
    }

    async publishTransaction(tx: Transaction) {
        const serializedTx = serialize_tx(tx);
        const jsonString = JSON.stringify(serializedTx);
        await this.node.services.pubsub.publish('bytechain:transactions', new TextEncoder().encode(jsonString));
        print('Published new transaction to network.');
    }

    async publishBlock(block: Block) {
        const serializedBlock = serialize_block(block);
        const jsonString = JSON.stringify(serializedBlock);
        await this.node.services.pubsub.publish('bytechain:blocks', new TextEncoder().encode(jsonString));
        print(`Published new block to network: Height: ${block.block_header.block_height}, Block Hash: ${block.block_header.block_hash}`);
    }
}

export default P2PNode;