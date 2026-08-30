import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { identify } from '@libp2p/identify';
import { kadDHT } from '@libp2p/kad-dht';
import { bootstrap } from '@libp2p/bootstrap';
import { gossipsub } from '@libp2p/gossipsub';
import { mdns } from '@libp2p/mdns';
import { ping } from '@libp2p/ping';
import { lpStream } from '@libp2p/utils';
import BlockChain from '../core/blockchain.js';
import Block from '../core/block.js';
import Transaction from '../core/transaction.js';

import { serialize_tx, deserialize_tx,
    serialize_block, deserialize_block
} from '../utils/serialization.js';
import { print } from '../utils/constants.js';


class P2PNode {
    node: any;
    blockchain: BlockChain;
    MEMPOOL_SYNC_PROTOCOL = '/bytechain/mempool/0.0.1';
    CHAIN_SYNC_PROTOCOL = '/bytechain/sync/0.0.1';
    SYNC_BATCH_SIZE = 100;
    private syncing_peers = new Set<string>();
    private syncing_mempool_peers = new Set<string>();

    constructor(blockchainInstance: BlockChain) {
        this.blockchain = blockchainInstance;
    }

    async start(port: number) {
        this.node = await createLibp2p({
            addresses: {
                listen: [
                    `/ip4/0.0.0.0/tcp/${port}/ws`,
                ]
            },
            transports: [
                webSockets()
            ],
            connectionEncrypters: [noise()],
            streamMuxers: [yamux()],
            peerDiscovery: [
                mdns({ interval: 20e3 }),
                bootstrap({
                    list: [
                        "/dns4/bytechain-bootstrap.onrender.com/tcp/443/wss/p2p/12D3KooWDFYeXNxPmKfbgs74q1xcnx16vprk4wvzrwgUEmppoVjX",
                        // "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
                        // "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
                        // "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt"
                    ]
                })
            ],
            services: {
                identify: identify(),
                ping: ping(),
                dht: kadDHT({ clientMode: false }),
                pubsub: gossipsub({
                    allowPublishToZeroTopicPeers: true,
                    D: 2, 
                    Dlo: 1,
                    Dhi: 3,
                })
            }
        });

        this.node.addEventListener('peer:discovery', (evt: any) => {
            const peer_id = evt.detail.id;

            this.node.dial(peer_id)
                .then(() => {
                    print(`Successfully connected to ${peer_id.toString()}`);
                })
                .catch((err: any) => {
                    console.error(
                        `Failed to dial ${peer_id.toString()}:`,
                        err
                    );
                });
        });

        await this.node.handle(this.MEMPOOL_SYNC_PROTOCOL, async (stream: any) => {
            const lp = lpStream(stream);

            try {
                const mempool_data = JSON.stringify(this.blockchain.tx_pool);
                await lp.write(new TextEncoder().encode(mempool_data));
            } catch (err: any) {
                console.error(`Error sharing mempool: ${err instanceof Error ? err.message : err}`);
            } finally {
                stream.close();
            }
            print("Shared mempool with a peer.");
        });

        await this.node.handle(this.CHAIN_SYNC_PROTOCOL, async (stream: any) => {
            const lp = lpStream(stream);
            
            try {
                while (true) {
                    const data = await lp.read();
                    if (!data) break;
                    const request = JSON.parse(new TextDecoder().decode(data.subarray()));
                    const height = this.blockchain.get_latest_block().block_header.block_height;
                    if (request.type === 'GET_HEIGHT') {
                        await lp.write(new TextEncoder().encode(JSON.stringify({ height })));
                    } else if (request.type === 'GET_BLOCKS') {
                        const chain_len = height + 1;
                        const to = Math.min(request.toHeight ?? chain_len, chain_len);
                        const blocks_to_send = this.blockchain.get_multiple_blocks(request.fromHeight, to);
                        const serialized_blocks = blocks_to_send.map(b => serialize_block(b));


                        await lp.write(
                            new TextEncoder().encode(JSON.stringify({ blocks: serialized_blocks })),
                            { signal: AbortSignal.timeout(15_000) }
                        );
                    }
                }
            } catch (err: any) {
                const msg = err instanceof Error ? err.message : String(err);
                if (!msg.includes('Unexpected EOF')) {
                console.error(`Error syncing chain: ${msg}`);
    }
            } finally {
                stream.close();
            }
        });

        this.node.addEventListener('peer:connect', async (evt: any) => {
            evt.detail;
        });

        this.node.addEventListener('peer:identify', async (evt: any) => {
            const { peerId, protocols } = evt.detail;
            const is_bytechain_peer = protocols.includes(this.CHAIN_SYNC_PROTOCOL);
            
            if (is_bytechain_peer) {
                print(`ByteChain peer identified: ${peerId.toString()}`);
                await this.sync_remote_chain(peerId);
                await this.request_mempool(peerId);
            }
        });

        this.node.addEventListener('peer:disconnect', (evt: any) => {
            evt.detail;
        });

        await this.node.start();
        print(`ByteChain P2P Node started with peer ID: ${this.node.peerId.toString()}`);
        await this.subscribe_to_topics();
    }

    async stop() {
        await this.node.stop();
        print('P2P Node stopped');
    }

    async subscribe_to_topics() {
        this.node.services.pubsub.subscribe('bytechain:transactions');
        this.node.services.pubsub.subscribe('bytechain:blocks');

        this.node.services.pubsub.addEventListener('message', async (evt: any) => {
            if (evt.detail.from.toString() === this.node.peerId.toString()) return;

            const { topic, data, from: from_peer } = evt.detail;
            const message_string = new TextDecoder().decode(data);
            let message: any;

            try {
                message = JSON.parse(message_string);
            } catch (error) {
                console.error('Error parsing JSON message:', error);
                return;
            }

            switch (topic) {
                case 'bytechain:transactions':
                    print(`Received new transaction from peer on topic ${topic}`);
                    try {
                        const received_tx = deserialize_tx(message);

                        if (!this.blockchain.tx_pool.find((tx: any) => tx.tx_id === received_tx.tx_id)) {
                            const add_result = this.blockchain.add_new_tx(received_tx);
                            if(add_result) print("Transaction added to pool");
                        }
                    } catch (error: any) {
                        console.error('Processing Tx Error:', error.message);
                    }
                    break;
                case 'bytechain:blocks':
                    print("Received new block from peer");
                    try {
                        const received_block = deserialize_block(message);
                        const local_height = this.blockchain.get_latest_block().block_header.block_height;
                        const peer_height = received_block.block_header.block_height;

                        if (peer_height > local_height) {
                            print(`Peer block height (${peer_height}) is ahead of local (${local_height}). Requesting sync...`);
                            await this.sync_remote_chain(from_peer);
                        } else {
                            print(`Block at height ${peer_height} already known, ignoring.`);
                        }
                    } catch (error: any) {
                        console.error(`Processing Block Error: ${error.message}`);
                    }
                    break;
                default:
                    print(`Received message on unknown topic ${topic}`);
            }
        });
    }

    async publish_tx(tx: Transaction) {
        if (this.node.getPeers().length === 0) {
            print("Warning: No peers connected. Transaction will not propagate.");
        }
        
        const serialized_tx = serialize_tx(tx);
        const json_string = JSON.stringify(serialized_tx);
        await this.node.services.pubsub.publish('bytechain:transactions', new TextEncoder().encode(json_string));
        print(`Published transaction: ${tx.tx_id}`);
    }

    async publish_block(block: Block) {
        const serialized_block = serialize_block(block);
        const json_string = JSON.stringify(serialized_block);
        await this.node.services.pubsub.publish('bytechain:blocks', new TextEncoder().encode(json_string));
        print(`New block published: Height: ${block.block_header.block_height}, Hash: ${block.block_header.block_hash}, tx count: ${block.transactions.length}`);
    }

    async sync_remote_chain(peerId: any) {
        const peer_str = peerId.toString();
        if (this.syncing_peers.has(peer_str)) return;
        this.syncing_peers.add(peer_str);

        let stream;
        
        try {
            stream = await this.node.dialProtocol(peerId, this.CHAIN_SYNC_PROTOCOL, {
                signal: AbortSignal.timeout(10_000)
            });
            const lp = lpStream(stream);

            await lp.write(
                new TextEncoder().encode(JSON.stringify({ type: 'GET_HEIGHT' })),
                { signal: AbortSignal.timeout(10_000) }
            );
            const height_result = await lp.read({ signal: AbortSignal.timeout(10_000) });
            const { height: remote_height } = JSON.parse(new TextDecoder().decode(height_result.subarray()));

            const local_height = this.blockchain.get_latest_block().block_header.block_height;

            if (remote_height <= local_height) {
                print("Chain is already up to date.");
                return;
            }

            print(`Peer is ahead (${remote_height} > ${local_height}). Requesting blocks in batches...`);

            const received_blocks: Block[] = [];
            let cursor = local_height + 1;

            while (cursor <= remote_height) {
                const to = Math.min(cursor + this.SYNC_BATCH_SIZE, remote_height + 1);

                await lp.write(
                    new TextEncoder().encode(JSON.stringify({ type: 'GET_BLOCKS', fromHeight: cursor, toHeight: to })),
                    { signal: AbortSignal.timeout(15_000) }
                );

                const blocks_result = await lp.read({ signal: AbortSignal.timeout(15_000) });
                if (!blocks_result) break;

                const { blocks } = JSON.parse(new TextDecoder().decode(blocks_result.subarray()));
                if (!blocks || blocks.length === 0) break;

                for (const blockData of blocks) {
                    received_blocks.push(deserialize_block(blockData));
                }

                print(`Fetched blocks ${cursor}-${to - 1} (${received_blocks.length} total so far)`);
                cursor = to;
            }

            if (received_blocks.length > 0) {
                this.blockchain.sync_chain(received_blocks);
                print(`Successfully synced ${received_blocks.length} blocks.`);
            }
        } catch (err: any) {
            console.error(`Chain Sync failed with ${peerId.toString()}:`, err.message);
        } finally {
            if (stream) stream.close();
            this.syncing_peers.delete(peer_str);
        }
    }

    async request_mempool(peerId: any) {
        const peer_str = peerId.toString();
        if (this.syncing_mempool_peers.has(peer_str)) return;
        this.syncing_mempool_peers.add(peer_str);

        let stream;
        try {
            const dialResult = await this.node.dialProtocol(peerId, this.MEMPOOL_SYNC_PROTOCOL);

            stream = dialResult.stream || dialResult;
            
            const lp = lpStream(stream);
            const response = await lp.read();

            if (response) {
                const mempoolString = new TextDecoder().decode(response.subarray());
                const remoteMempool = JSON.parse(mempoolString);
                
                print(`Received ${remoteMempool.length} transactions from peer.`);
                
                remoteMempool.forEach((txData: any) => {
                    const tx = deserialize_tx(txData);
                    if (!this.blockchain.tx_pool.find(t => t.tx_id === tx.tx_id)) {
                        this.blockchain.add_new_tx(tx);
                    }
                });
            }
        } catch (err: any) {
            console.error(`Mempool sync failed:`, err.message);
        } finally {
            if (stream) stream.close();
            this.syncing_mempool_peers.delete(peer_str);
        }
    }
}

export default P2PNode;