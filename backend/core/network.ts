import P2PNetwork from './p2p';
import BlockchainNode from './node';

(async () => {
    try {
        // Create a new BlockchainNode
        const blockchainNode = new BlockchainNode();

        // Initialize P2P network
        const p2p = new P2PNetwork();
        const { privateKey, publicKey, blockchainAddress } = blockchainNode.wallet;
        const id = blockchainAddress;
        await p2p.StartNode(privateKey, publicKey, id); // Start P2P node

        // Start mining process in blockchain node
        await blockchainNode.StartMining();

        // Optionally, handle incoming messages and other P2P logic
        p2p.HandleMessages();

    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
    }
})();
