# ByteChain: Testnet Alpha (v0.1.0)

**Warning:** ByteChain is in active development. Features are subject to change, and this Testnet Alpha should be used for experimental purposes only. Your feedback is highly appreciated!

## Project Overview

ByteChain is a decentralized blockchain project designed to provide a robust framework for secure transactions and, in future phases, smart contracts and decentralized applications (dApps). The Testnet Alpha focuses on establishing a resilient peer-to-peer network and validating core blockchain functionalities, including basic transactions and the Proof-of-Work consensus mechanism.

While this Testnet Alpha is limited to fundamental transaction processing and network synchronization, the roadmap for the **Mainnet** includes advanced features such as the **ByteChain Virtual Machine (BVM)** for executing smart contracts written in the **Byte language**.

## Features of ByteChain Testnet Alpha (Current)

* **Core Blockchain Operations**: Supports the creation, validation, and inclusion of basic transactions into blocks.
* **Transaction Pool (Mempool)**: Transactions broadcast to the network are held in a temporary pool, awaiting selection and inclusion by miners into new blocks.
* **Proof-of-Work (PoW) Consensus**: Blocks are secured and validated using a customizable Proof-of-Work algorithm, ensuring network integrity and resistance to double-spending.
* **Distributed Network (LibP2P)**: Nodes communicate and synchronize via a `libp2p` network, utilizing PubSub (GossipSub) for efficient propagation of new transactions and mined blocks across the network. This provides a robust and scalable foundation for decentralized communication.
* **Automatic Mining**: Nodes are configured to automatically attempt to mine new blocks at regular intervals, selecting transactions from the pool to include. This simulates continuous block production and network progression, and **does not require manual intervention**.
* **Unique Balance Calculation Model**: ByteChain employs a distinct balance management approach. When a user sends Byte (the native currency), their balance is *immediately reduced* by the sent amount. However, the recipient's balance is *only updated once the transaction is mined and included in a block on-chain*. This design allows senders to issue multiple transactions concurrently, provided they have sufficient funds, without waiting for previous transactions to be confirmed, while still preventing double-spending of the same funds.
* **HTTP API for Client Interaction**: A RESTful API is exposed by each node, allowing external clients (like wallets and block explorers) to query blockchain data and submit *pre-signed* transactions. This decouples the client interface from the core P2P network.

## Architecture Highlights

* **Node-to-Node (P2P) Communication**: Handled by `libp2p`, providing robust peer discovery (mDNS for local, extendable to DHT for global), secure connections (Noise), and efficient data propagation (GossipSub PubSub) for blocks and transactions.
* **Client (Wallet/Explorer) to Node Communication**: Managed via a standard HTTP API (Express.js), enabling wallets to interact with the blockchain by sending signed transactions and querying chain state.
    * **Crucial Note on Wallet Security**: Wallet applications are responsible for **client-side account creation** (generating and securing private keys) and **client-side transaction signing**. ByteChain nodes do not manage user private keys or create accounts; they only process and validate signed transactions submitted by clients.
    * **Client-Side Development**: For building client-side applications (like web wallets or block explorers) that interact with ByteChain nodes, a dedicated JavaScript library like `bc-web3js` can be used. This library simplifies common tasks such as account management, transaction signing, and interacting with the node's API.
* **Modular Design**: The project is structured with separation of concerns, aiming for a reusable core blockchain library.

## Installation

To run a ByteChain Testnet Alpha node locally, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/ByteChain-Labs/ByteChain-Testnet-Alpha.git
    ```

2.  **Install Dependencies**:
    Navigate to the project directory and install the necessary packages. This includes `libp2p`, `express`, and their associated types.
    ```bash
    cd ByteChain-Testnet-Alpha
    npm install
    ```

3.  **Run the Testnet Node(s)**:
    You can start multiple nodes to see the P2P network in action. Each node should listen on a unique `LIBP2P_PORT` and `HTTP_PORT`.

    * **Terminal 1 (Node 1 - Primary)**:
        ```bash
        LIBP2P_PORT=4001 HTTP_PORT=3001 npm run bcnode
        ```

    * **Terminal 2 (Node 2 - Peer)**:
        ```bash
        LIBP2P_PORT=4002 HTTP_PORT=3002 npm run bcnode
        ```

    * **Terminal 3 (Node 3 - Another Peer)**:
        ```bash
        LIBP2P_PORT=4003 HTTP_PORT=3003 npm run bcnode
        ```
    You should observe nodes discovering each other and exchanging blocks and transactions in their logs, with blocks being mined automatically.

## Usage (Under Development)

### Interacting via HTTP API:

Each running node exposes an HTTP API for client interaction. You can use tools like `curl`, Postman, or your web browser to interact.

* **View the Blockchain**:
    * Open your browser to `http://localhost:3001/chain` (replace `3001` with your node's `HTTP_PORT`).
* **View Pending Transactions**:
    * `http://localhost:3001/transactions/pool`
* **Check Account Balance**:
    * `http://localhost:3001/balance/<YOUR_ADDRESS>` (Replace `<YOUR_ADDRESS>` with an actual ByteChain address from the node's logs, or an address you generated in your test script).
* **Submit a Signed Transaction**:
    Transactions **must be signed on the client-side** using the sender's private key. The API expects the complete, signed transaction object.
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{
        "amount": 10,
        "sender": "SENDER_BYTECHAIN_ADDRESS",
        "recipient": "RECIPIENT_BYTECHAIN_ADDRESS",
        "publicKey": "SENDER_PUBLIC_KEY",
        "signature": "TRANSACTION_SIGNATURE",
        "nonce": SENDER_NONCE
    }' http://localhost:3001/transactions/send
    ```
* **Trigger a Manual Block Mine (For Testing/Debugging Only)**:
    While nodes mine automatically, this endpoint can be used to force a block mine immediately for testing purposes, rather than waiting for the automatic interval.
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"minerAddress": "YOUR_MINER_BYTECHAIN_ADDRESS"}' http://localhost:3001/mine
    ```

### Node Operations:

* **Automatic Mining**: Nodes will continuously mine new blocks containing valid transactions from their pool.
* **Transaction Propagation**: Transactions created on one node are automatically broadcast to other connected peers via `libp2p`'s PubSub.
* **Block Mining & Propagation**: When a node successfully mines a block, it is broadcast to the network, and other nodes will validate and add it to their chain, clearing included transactions from their local pools.

## Future Development & Roadmap

* **Robust Chain Synchronization**: Implement a more sophisticated mechanism for new nodes to synchronize their chains upon connecting, and for fork resolution.
* **Comprehensive Transaction Validation**: Enhance validation of transactions, including proper nonce management, sufficient balance checks before adding to the pool, and rigorous signature verification.
* **Robust Block Validation**: Full validation of Proof-of-Work and all transactions within a received block, ensuring compliance with network rules.
* **Wallet & Block Explorer UIs**: Dedicated frontend applications leveraging the HTTP API for a user-friendly experience.
* **ByteChain Virtual Machine (BVM)**: Development of a virtual machine and a `Byte` smart contract language to enable decentralized applications.
* **Advanced Peer Discovery**: Integration of DHT and other `libp2p` discovery mechanisms for global peer discovery.
* **Persistence**: Saving the blockchain state to disk to allow nodes to restart and resume from their last known state.

## Contributing

We welcome contributions from developers, researchers, and blockchain enthusiasts to help make ByteChain a robust and scalable platform. If you’d like to help with the development, please see the [Contributing Guidelines](CONTRIBUTING.md).

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
