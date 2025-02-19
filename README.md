# Warning: ????
ByteChain is still in development so some features might not work yet. Thank you.


# ByteChain Testnet Alpha
ByteChain is a decentralized blockchain project designed to provide a robust framework for transactions, smart contracts, and decentralized applications (dApps). The Testnet Alpha phase is focused on testing the core blockchain functionalities, including basic transactions, consensus mechanisms, and node communication. While the Testnet is limited to basic transaction functionalities, the mainnet will include advanced features such as the ByteChain Virtual Machine (BVM) and Byte language for executing smart contracts.

## Features of ByteChain Testnet Alpha
- **Basic Blockchain Transactions**: Testnet Alpha focuses on sending and receiving transactions on a decentralized network.
- **Transaction Pool**: Transactions are first added to a pool, where miners will select them to mine into blocks.
- **Proof-of-Work**: Transactions are validated using the Proof-of-Work consensus mechanism, ensuring network security and preventing double-spending.
- **Unique Balance Calculation**: Balance are calculated not in the traditional Account or UTXO model. ByteChain calculates user balance in this fashion, if a user sends byte(The native coin for the ByteChain network) (his/her/don't know) balances is immediately reduced by the amount sent but the person that is supposed to receive the coins don't receive them immediately until the transaction is mined and added to a block onchain. This is good because users can make many transactions if their balance is enough to cover for it instead of them waiting for a transaction to be finalized before they can do another transaction but this also prevents them from spending the same token they sent by reducing their balance immediately a transaction occurs.


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
    ```
    ```bash
    npm install
    ```


3. **Run the Testnet**:
    Start the testnet by running:
    ```bash
    npm run bcnode
    ```

    This will start the blockchain network on your local machine, and you can begin testing basic transactions.

## Usage
- **Sending Transactions**: Use the provided API or local interface to send transactions. The transactions will first be added to the transaction pool before being mined by a node.(still in development)
- **Mining**: Nodes in the network will mine blocks containing valid transactions.

## Contributing
We welcome contributions to improve ByteChain. If you’d like to help with the development, please see the [Contributing Guidelines](CONTRIBUTING.md).

## License
This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
