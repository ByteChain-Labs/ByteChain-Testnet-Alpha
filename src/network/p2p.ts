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
import {
    serialize_tx, deserialize_tx,
    serialize_block, deserialize_block,
} from '../utils/serialization.js';
import { print } from '../utils/constants.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class P2PNode {
    node: any;
    blockchain: BlockChain;
    readonly MEMPOOL_SYNC_PROTOCOL = '/bytechain/mempool/0.0.1';
    readonly CHAIN_SYNC_PROTOCOL = '/bytechain/sync/0.0.1';
    readonly SYNC_BATCH_SIZE = 32;
    readonly SYNC_TIMEOUT_MS = 15_000;
    public is_syncing = false;

    private syncing_peers = new Set<string>();
    private syncing_mempool_peers = new Set<string>();
    private bytechain_peers = new Map<string, any>();
    private sync_queue: Promise<void> = Promise.resolve();
    private sync_timer: ReturnType<typeof setInterval> | undefined;

    constructor(blockchainInstance: BlockChain) {
        this.blockchain = blockchainInstance;
    }

    async start(port: number) {
        const default_bootstrap = [
            "/dns4/bytechain-bootstrap.onrender.com/tcp/443/wss/p2p/12D3KooWDFYeXNxPmKfbgs74q1xcnx16vprk4wvzrwgUEmppoVjX",
        ];
        const bootstrap_peers = (process.env.BYTECHAIN_BOOTSTRAP_PEERS ?? default_bootstrap.join(","))
            .split(",")
            .map(address => address.trim())
            .filter(Boolean);
        const announce_addresses = (process.env.BYTECHAIN_ANNOUNCE_ADDRESSES ?? "")
            .split(",")
            .map(address => address.trim())
            .filter(Boolean);

        this.node = await createLibp2p({
            addresses: {
                listen: [`/ip4/0.0.0.0/tcp/${port}/ws`],
                ...(announce_addresses.length > 0 ? { announce: announce_addresses } : {}),
            },
            transports: [webSockets()],
            connectionEncrypters: [noise()],
            streamMuxers: [yamux()],
            peerDiscovery: [
                mdns({ interval: 20_000 }),
                bootstrap({ list: bootstrap_peers }),
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
                }),
            },
        });

        this.node.addEventListener("peer:discovery", (evt: any) => {
            const peerId = evt.detail.id;
            this.node.dial(peerId, { signal: AbortSignal.timeout(10_000) })
                .then(() => print(`Connected to discovered peer ${peerId.toString()}`))
                .catch((err: any) => {
                    const message = err instanceof Error ? err.message : String(err);
                    if (!message.toLowerCase().includes("already connected")) {
                        print(`Could not dial discovered peer ${peerId.toString()}: ${message}`);
                    }
                });
        });

        await this.node.handle(this.MEMPOOL_SYNC_PROTOCOL, async (stream: any) => {
            try {
                const lp = lpStream(stream);
                const transactions = this.blockchain.tx_pool.slice(0, 1_000).map(serialize_tx);
                await lp.write(encoder.encode(JSON.stringify({ transactions })), {
                    signal: AbortSignal.timeout(this.SYNC_TIMEOUT_MS),
                });
            } catch (err: any) {
                print(`Error sharing mempool: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                try { await stream.close(); } catch { }
            }
        });

        await this.node.handle(this.CHAIN_SYNC_PROTOCOL, async (stream: any) => {
            const lp = lpStream(stream);
            try {
                while (true) {
                    const data = await lp.read({ signal: AbortSignal.timeout(60_000) });
                    if (!data) break;

                    let request: any;
                    try {
                        request = JSON.parse(decoder.decode(data.subarray()));
                    } catch {
                        await lp.write(encoder.encode(JSON.stringify({ error: "Malformed JSON request" })));
                        continue;
                    }

                    let response: any;
                    try {
                        switch (request.type) {
                            case "GET_HEIGHT": {
                                const latest = this.blockchain.get_latest_block();
                                response = {
                                    height: latest.block_header.block_height,
                                    headHash: latest.block_header.block_hash,
                                };
                                break;
                            }
                            case "GET_BLOCK_HASH": {
                                const height = request.height;
                                if (!Number.isSafeInteger(height) || height < 0 || height >= this.blockchain.chain.length) {
                                    throw new Error("Requested block height is out of range");
                                }
                                response = {
                                    height,
                                    hash: this.blockchain.chain[height].block_header.block_hash,
                                };
                                break;
                            }
                            case "GET_BLOCKS": {
                                const from_height = request.from_height;
                                const requested_to = request.to_height;
                                if (
                                    !Number.isSafeInteger(from_height) || from_height < 0 ||
                                    !Number.isSafeInteger(requested_to) || requested_to < from_height
                                ) {
                                    throw new Error("Invalid block range");
                                }

                                const chainLength = this.blockchain.chain.length;
                                const to_height = Math.min(requested_to, from_height + this.SYNC_BATCH_SIZE, chainLength);
                                const blocks = this.blockchain.get_multiple_blocks(from_height, to_height);
                                response = { blocks: blocks.map(serialize_block) };
                                break;
                            }
                            default:
                                throw new Error("Unsupported chain-sync request type");
                        }
                    } catch (err: any) {
                        response = { error: err instanceof Error ? err.message : String(err) };
                    }

                    await lp.write(encoder.encode(JSON.stringify(response)), {
                        signal: AbortSignal.timeout(this.SYNC_TIMEOUT_MS),
                    });
                }
            } catch (err: any) {
                const message = err instanceof Error ? err.message : String(err);
                if (!message.includes("Unexpected EOF") && !message.includes("aborted")) {
                    print(`Chain-sync stream closed: ${message}`);
                }
            } finally {
                try { await stream.close(); } catch { }
            }
        });

        this.node.addEventListener("peer:identify", async (evt: any) => {
            const detail = evt.detail ?? {};
            const peerId = detail.peerId;
            const protocols: string[] = Array.isArray(detail.protocols) ? detail.protocols : [];
            if (!peerId || !protocols.includes(this.CHAIN_SYNC_PROTOCOL)) return;

            const peer_key = peerId.toString();
            this.bytechain_peers.set(peer_key, peerId);
            print(`ByteChain peer identified: ${peer_key}`);

            await this.sync_remote_chain(peerId);
            await this.request_mempool(peerId);
        });

        this.node.addEventListener("peer:disconnect", (evt: any) => {
            const detail = evt.detail ?? {};
            const peerId = detail.remotePeer ?? detail.peerId;
            if (peerId) {
                const key = peerId.toString();
                this.bytechain_peers.delete(key);
                this.syncing_peers.delete(key);
                this.syncing_mempool_peers.delete(key);
            }
        });

        await this.node.start();
        print(`ByteChain P2P Node started with peer ID: ${this.node.peerId.toString()}`);
        await this.subscribe_to_topics();

        this.sync_timer = setInterval(() => {
            for (const peerId of this.bytechain_peers.values()) {
                void this.sync_remote_chain(peerId).catch((err: any) => {
                    print(`Periodic sync failed: ${err instanceof Error ? err.message : String(err)}`);
                });
            }
        }, 30_000);
    }

    async stop() {
        if (this.sync_timer) clearInterval(this.sync_timer);
        this.sync_timer = undefined;
        this.bytechain_peers.clear();
        if (this.node) await this.node.stop();
        print("P2P Node stopped");
    }

    async subscribe_to_topics() {
        this.node.services.pubsub.subscribe("bytechain:transactions");
        this.node.services.pubsub.subscribe("bytechain:blocks");

        this.node.services.pubsub.addEventListener("message", async (evt: any) => {
            const detail = evt.detail ?? {};
            if (detail.from?.toString() === this.node.peerId.toString()) return;

            const { topic, data, from: fromPeer } = detail;
            let message: any;
            try {
                message = JSON.parse(decoder.decode(data));
            } catch (err) {
                print(`Rejected malformed pubsub message: ${err instanceof Error ? err.message : String(err)}`);
                return;
            }

            switch (topic) {
                case "bytechain:transactions": {
                    try {
                        const tx = deserialize_tx(message);
                        if (this.is_transaction_known(tx.tx_id)) return;
                        this.blockchain.add_new_tx(tx);
                        print(`Accepted transaction ${tx.tx_id} from the network`);
                    } catch (err: any) {
                        print(`Rejected network transaction: ${err instanceof Error ? err.message : String(err)}`);
                    }
                    break;
                }
                case "bytechain:blocks": {
                    if (this.is_syncing) {
                        print("Ignoring block gossip during historical sync; the sync loop will re-check the peer height.");
                        return;
                    }
                    try {
                        const block = deserialize_block(message);
                        const local_height = this.blockchain.get_latest_block().block_header.block_height;
                        const peer_height = block.block_header.block_height;

                        if (peer_height === local_height + 1 && this.blockchain.append_single_block(block)) {
                            print(`Accepted block ${peer_height}`);
                            return;
                        }

                        if (peer_height > local_height || peer_height === local_height + 1) {
                            if (fromPeer) await this.sync_remote_chain(fromPeer);
                        } else {
                            print(`Ignoring outdated block at height ${peer_height}`);
                        }
                    } catch (err: any) {
                        print(`Rejected network block: ${err instanceof Error ? err.message : String(err)}`);
                        if (fromPeer) await this.sync_remote_chain(fromPeer);
                    }
                    break;
                }
                default:
                    print(`Received message on unknown topic ${topic}`);
            }
        });
    }

    private is_transaction_known(txId: string): boolean {
        if (this.blockchain.tx_pool.some(tx => tx.tx_id === txId)) return true;
        return this.blockchain.chain.some(block => block.transactions.some(tx => tx.tx_id === txId));
    }

    async publish_tx(tx: Transaction) {
        const serialized = JSON.stringify(serialize_tx(tx));
        await this.node.services.pubsub.publish("bytechain:transactions", encoder.encode(serialized));
        print(`Published transaction: ${tx.tx_id}`);
    }

    async publish_block(block: Block) {
        const serialized = JSON.stringify(serialize_block(block));
        await this.node.services.pubsub.publish("bytechain:blocks", encoder.encode(serialized));
        print(`Published block ${block.block_header.block_height} (${block.transactions.length} transactions)`);
    }

    async sync_remote_chain(peerId: any): Promise<void> {
        const task = this.sync_queue.then(() => this.perform_sync_remote_chain(peerId));
        this.sync_queue = task.catch(() => undefined);
        return task;
    }

    private async perform_sync_remote_chain(peerId: any): Promise<void> {
        const peer_key = peerId.toString();
        const active_peers = this.node.getPeers().map((peer: any) => peer.toString());
        if (!active_peers.includes(peer_key)) {
            print(`Sync skipped: peer ${peer_key} is no longer connected`);
            return;
        }
        if (this.syncing_peers.has(peer_key)) return;

        this.syncing_peers.add(peer_key);
        this.is_syncing = true;
        let stream: any;

        try {
            stream = await this.node.dialProtocol(peerId, this.CHAIN_SYNC_PROTOCOL, {
                signal: AbortSignal.timeout(10_000),
            });
            const lp = lpStream(stream);

            const exchange = async (request: Record<string, unknown>, timeout = this.SYNC_TIMEOUT_MS): Promise<any> => {
                await lp.write(encoder.encode(JSON.stringify(request)), {
                    signal: AbortSignal.timeout(timeout),
                });
                const response_bytes = await lp.read({ signal: AbortSignal.timeout(timeout) });
                if (!response_bytes) throw new Error("Peer closed the sync stream without responding");
                const response = JSON.parse(decoder.decode(response_bytes.subarray()));
                if (response?.error) throw new Error(`Peer rejected sync request: ${response.error}`);
                return response;
            };

            for (let round = 0; round < 16; round++) {
                const status = await exchange({ type: "GET_HEIGHT" });
                const remote_height = status.height;
                if (!Number.isSafeInteger(remote_height) || remote_height < 0) {
                    throw new Error("Peer returned an invalid chain height");
                }

                const local_height = this.blockchain.get_latest_block().block_header.block_height;
                const local_head_hash = this.blockchain.get_latest_block().block_header.block_hash;

                if (remote_height <= local_height) {
                    if (remote_height === local_height && status.headHash !== local_head_hash) {
                        print(`Peer ${peer_key} has a different chain at the same height; keeping the local chain on a tie`);
                    } else {
                        print(`Chain is up to date with ${peer_key}`);
                    }
                    return;
                }

                let low = 0;
                let high = Math.min(local_height, remote_height);
                let common_height = -1;
                while (low <= high) {
                    const middle = Math.floor((low + high) / 2);
                    const remoteHash = await exchange({ type: "GET_BLOCK_HASH", height: middle });
                    const localHash = this.blockchain.chain[middle]?.block_header.block_hash;
                    if (remoteHash.hash === localHash) {
                        common_height = middle;
                        low = middle + 1;
                    } else {
                        high = middle - 1;
                    }
                }
                if (common_height < 0) throw new Error("Peer is on a different network: no common genesis block");

                print(`Syncing from shared ancestor ${common_height}; peer height is ${remote_height}`);
                const received_blocks: Block[] = [];
                let cursor = common_height + 1;

                while (cursor <= remote_height) {
                    const to_height = Math.min(cursor + this.SYNC_BATCH_SIZE, remote_height + 1);
                    const response = await exchange({ type: "GET_BLOCKS", from_height: cursor, to_height });
                    if (!Array.isArray(response.blocks)) throw new Error("Peer returned an invalid block batch");

                    const expected_count = to_height - cursor;
                    if (response.blocks.length !== expected_count) {
                        throw new Error(`Incomplete block batch: expected ${expected_count}, received ${response.blocks.length}`);
                    }

                    const batch = response.blocks.map((data: any) => deserialize_block(data));
                    for (let i = 0; i < batch.length; i++) {
                        const expected_height = cursor + i;
                        if (batch[i].block_header.block_height !== expected_height) {
                            throw new Error(`Peer returned block ${batch[i].block_header.block_height} where height ${expected_height} was expected`);
                        }
                    }
                    received_blocks.push(...batch);
                    cursor += batch.length;
                    print(`Fetched through block ${cursor - 1} (${received_blocks.length} block(s) in this sync)`);
                }

                const replaced = this.blockchain.replace_chain_from(common_height, received_blocks);
                if (!replaced) {
                    const now_height = this.blockchain.get_latest_block().block_header.block_height;
                    if (now_height >= remote_height) return;
                    throw new Error("Downloaded chain was not applied");
                }
                print(`Chain sync applied ${received_blocks.length} block(s).`);
            }

            print(`Sync with ${peer_key} stopped after repeated catch-up rounds; the next retry will continue it`);
        } catch (err: any) {
            print(`Chain sync failed with ${peer_key}: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            if (stream) {
                try { await stream.close(); } catch { /* stream may already be closed */ }
            }
            this.syncing_peers.delete(peer_key);
            this.is_syncing = this.syncing_peers.size > 0;
        }
    }

    async request_mempool(peerId: any) {
        const peer_key = peerId.toString();
        if (this.syncing_mempool_peers.has(peer_key)) return;
        this.syncing_mempool_peers.add(peer_key);

        let stream: any;
        try {
            const dial_result = await this.node.dialProtocol(peerId, this.MEMPOOL_SYNC_PROTOCOL, {
                signal: AbortSignal.timeout(10_000),
            });
            stream = dial_result.stream || dial_result;
            const lp = lpStream(stream);
            const response = await lp.read({ signal: AbortSignal.timeout(this.SYNC_TIMEOUT_MS) });
            if (!response) return;

            const payload = JSON.parse(decoder.decode(response.subarray()));
            if (!Array.isArray(payload.transactions)) throw new Error("Peer returned an invalid mempool payload");
            print(`Received ${payload.transactions.length} pending transaction(s) from ${peer_key}`);

            for (const txData of payload.transactions) {
                try {
                    const tx = deserialize_tx(txData);
                    if (!this.is_transaction_known(tx.tx_id)) this.blockchain.add_new_tx(tx);
                } catch (err: any) {
                    print(`Skipped mempool transaction: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
        } catch (err: any) {
            print(`Mempool sync failed with ${peer_key}: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            if (stream) {
                try { await stream.close(); } catch { /* stream may already be closed */ }
            }
            this.syncing_mempool_peers.delete(peer_key);
        }
    }
}

export default P2PNode;