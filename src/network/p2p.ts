import WebSocket from "ws";
import { Message, MessageType } from "./message_type";
import BlockChain from "../core/blockchain";

//Using arbitrary port for now.

// Loop through every peer in peers.txt and establish a connection.



class TcpServer {
    bcimpl: BlockChain;

    constructor(bcimpl: BlockChain) {
        this.bcimpl = bcimpl;
    }

    start() {
        const wss_port: number = 3000;
        const wss = new WebSocket.Server({ port: wss_port });

        wss.on('connection', (ws: WebSocket) => {
            console.log("New peer connected.");

            // Todo: send actual message i.e(Transaction Message...)
            ws.on('message', (message: Message) => {
                if (message.type === MessageType.TransactionMessage) {
                    ws.send("Message received. \nSending transactions");
                } else if (message.type === MessageType.BlockMessage) {
                    ws.send("Message received. \nSending blocks");
                } else if (message.type === MessageType.ChainMessage) {
                    ws.send("Message received. \nSending chain data");
                    ws.send(this.bcimpl.chain);
                } else {
                    ws.send("Unknown message type.");
                }
            });

            ws.on('close', () => {
                console.log("Peer disconnected")
            });
        });
    }
}



class TcpClient {
    start() {
        const ws = new WebSocket('ws:localhost:3001');

        ws.on('open', () => {
            console.log("Connected to peer.");

            // Todo: Write different message type that a peer can send on connecting
            ws.send("TRANSACTION");
        });

        // Todo: send actual message i.e(Transaction Message...)
        ws.on('message', (message: Message) => {
            if (message.type === MessageType.TransactionMessage) {
                ws.send("Message received. \nSending transactions");
            } else if (message.type === MessageType.BlockMessage) {
                ws.send("Message received. \nSending blocks");
            } else if (message.type === MessageType.ChainMessage) {
                ws.send("Message received. \nSending chain data");
            } else {
                ws.send("Unknown message type.");
            }
        });

        ws.on('close', () => {
            console.log("Peer disconnected")
        });
    }
}











export { TcpServer, TcpClient };