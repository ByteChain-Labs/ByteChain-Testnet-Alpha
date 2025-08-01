enum Message_Type {
    HANDSHAKE = 'handshake',
    HANDSHAKE_ACK = 'handshake_ack',
    NEW_BLOCK = 'new_block',
    NEW_TRANSACTION = 'new_transaction',
    CHAIN_REQUEST = 'chain_request',
    CHAIN_RESPONSE = 'chain_response',
}

interface Message {
    type: Message_Type;
    payload: any;
}

export { Message_Type, Message };