import Transaction from "./core/transaction";
import { TCPServer, TCPClient } from "./network/p2p";
import { BlockchainMessage } from "./utils/core_constants";

// Example usage
const server = new TCPServer(3000);
server.Start();

const client1 = new TCPClient('127.0.0.1', 3000);
const client2 = new TCPClient('127.0.0.1', 3000);

const transaction: Transaction = new Transaction(10, 'abc', 'def', 'signa')
const transaction2 = new Transaction(10, 'abc', 'def', 'signa')

const message: BlockchainMessage = {
    type: 'newTransaction', 
    payload: transaction
}

const message2: BlockchainMessage = {
    type: 'newTransaction', 
    payload: transaction2
}

client1.SendMessage(message);
client2.SendMessage(message2);