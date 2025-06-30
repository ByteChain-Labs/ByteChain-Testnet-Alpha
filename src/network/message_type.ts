import Transaction from "../core/transaction.js";
import Block from "../core/block.js";
import BlockChain from "../core/blockchain.js";


type BaseMessage = {
    node_pub_key: string,
    node_sig: string
};

enum MessageType {
    TransactionMessage = "TRANSACTION",
    BlockMessage = "BLOCK",
    ChainMessage = "CHAIN"
};

type TransactionMessage = {
    type: MessageType.TransactionMessage;
    payload: Transaction;
    base_msg: BaseMessage
}

type BlockMessage = {
    type: MessageType.BlockMessage;
    payload: Block;
    base_msg: BaseMessage
}

type ChainMessage = {
    type: MessageType.ChainMessage;
    payload: BlockChain;
    base_msg: BaseMessage
}

type Message = TransactionMessage | BlockMessage | ChainMessage;


export { Message, MessageType };