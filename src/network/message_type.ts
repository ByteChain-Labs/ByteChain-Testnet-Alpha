import Transaction from "../core/transaction"
import Block from "../core/block"
import BlockChain from "../core/blockchain"


type BaseMessage = {
    node_pub_key: string,
    node_sig: string
};

type Message<T> = {
    payload: T,
    base_msg: BaseMessage
};

type TransactionMessage = Message<Transaction>;
type BlockMessage = Message<Block>;
type ChainMessage = Message<BlockChain>;

enum MessageType {
    TransactionMessage = "TRANSACTION",
    BlockMessage = "BLOCK",
    ChainMessage = "CHAIN"
};

type MessageMapping = {
    [MessageType.TransactionMessage]: TransactionMessage;
    [MessageType.BlockMessage]: BlockMessage;
    [MessageType.ChainMessage]: ChainMessage;
};


export { MessageType, MessageMapping };