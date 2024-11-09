# ByteChain Testnet Alpha

Welcome to the **ByteChain Testnet Alpha**! This is the initial test phase for ByteChain, a new blockchain network designed for secure, decentralized, and scalable token transfers. In the Testnet Alpha phase, ByteChain is focused solely on the transfer functionality of its native token, `ByteToken`.

## Project Overview

**ByteChain** aims to offer a versatile blockchain platform capable of supporting a variety of decentralized applications (DApps) and token standards. The Testnet Alpha release allows users and developers to explore and test the fundamental aspects of token transfers within the ByteChain network. This phase provides critical insights and feedback necessary for enhancing the ByteChain ecosystem in subsequent phases.

## Key Features of Testnet Alpha

- **Native Token Transfer**: ByteChain Testnet Alpha supports basic transfers of the native token `ByteToken` between accounts.
- **Initial Testing Environment**: Aimed at developers and testers to familiarize themselves with ByteChain’s underlying technology and test token transfer operations.
- **Open Source**: All code is open for review, testing, and contributions.

## Getting Started

To start using ByteChain Testnet Alpha, follow these steps:

### Prerequisites

1. **Node.js** (version 14 or higher recommended)
2. **Git** for cloning the repository

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/bytechain.git
    ```
2. Navigate to the project directory:
    ```bash
    cd bytechain
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Start the ByteChain node:
    ```bash
    npm start
    ```

### Basic Usage

To transfer `ByteToken` between accounts, use the provided API endpoints or CLI (command-line interface) commands. For example, you can initiate a transfer with the following command (ensure your node is running):

```bash
node transfer.js --from [SenderWalletAddress] --to [RecipientWalletAddress] --amount [Amount]
