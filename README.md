# ByteChain Testnet Alpha

ByteChain is a decentralized blockchain project designed to provide a robust framework for transactions, smart contracts, and decentralized applications (dApps). The Testnet Alpha phase is focused on testing the core blockchain functionalities, including basic transactions, consensus mechanisms, and node communication. While the Testnet is limited to basic transaction functionalities, the mainnet will include advanced features such as the ByteChain Virtual Machine (BVM) and Byte language for executing smart contracts.

## Features

- **Basic Blockchain Transactions**: Testnet Alpha focuses on sending and receiving transactions on a decentralized network.
- **Transaction Pool**: Transactions are first added to a pool, where miners will select them to mine into blocks.
- **Proof-of-Work**: Transactions are validated using the Proof-of-Work consensus mechanism, ensuring network security and preventing double-spending.
- **Future Features**: The mainnet will feature smart contract functionality with the ByteChain Virtual Machine (BVM), enabling developers to build decentralized applications.

## Roadmap

- **Testnet Alpha**: Focuses on core blockchain transactions and the Proof-of-Work consensus mechanism.
- **Testnet Beta**: Introduces the **ByteChain Virtual Machine (BVM)** and **Byte language** for executing smart contracts.
- **Mainnet**: The final phase will include all features, with a fully operational blockchain that supports smart contracts and decentralized applications.

## Installation

To run ByteChain Testnet Alpha locally, follow these steps:

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/ByteChain-Labs/ByteChain-Testnet-Alpha.git
    ```

2. **Install Dependencies**:
    Navigate to the project directory and install the necessary packages:
    ```bash
    cd ByteChain-Testnet-Alpha
    npm install
    ```

3. **Run the Testnet**:
    Start the testnet by running:
    ```bash
    npm start
    ```

    This will start the blockchain network on your local machine, and you can begin testing basic transactions.

## Usage

- **Sending Transactions**: Use the provided API or local interface to send transactions. The transactions will first be added to the transaction pool before being mined by a node.
- **Mining**: Nodes in the network will mine blocks containing valid transactions.

## Contributing

We welcome contributions to improve ByteChain. If you’d like to help with the development, please see the [Contributing Guidelines](CONTRIBUTING.md).

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
