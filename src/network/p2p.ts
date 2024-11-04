import * as net from 'net';
import { BlockchainMessage } from '../utils/core_constants';

class P2PNode {
    private server: net.Server;
    private port: number;
    private clients: net.Socket[] = [];
    private peers: { [key: string]: net.Socket } = {};

    constructor(port: number) {
        this.port = port;
        this.server = net.createServer(this.HandleConnection.bind(this));
    }

    private HandleConnection(socket: net.Socket): void {
        console.log('New connection:', socket.remoteAddress);
        this.clients.push(socket);

        socket.on('data', (data) => {
            try {
                const message: BlockchainMessage = JSON.parse(data.toString());
                console.log('Received message:', message);
                this.HandleMessage(message, socket);
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        });

        socket.on('end', () => {
            console.log('Connection ended:', socket.remoteAddress);
            this.clients = this.clients.filter((client) => client !== socket);
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
    }

    private HandleMessage(message: BlockchainMessage, sender: net.Socket) {
        switch (message.type) {
            case 'newTransaction':
            case 'newBlock':
                this.BroadcastMessage(message, sender);
                break;
            case 'requestBlockchain':
                this.SendBlockchainToClient(sender);
                break;
            case 'syncBlockchain':
                this.UpdateBlockchain(message.payload);
                break;
            default:
                console.log('Unknown message type');
        }
    }

    private BroadcastMessage(message: BlockchainMessage, sender: net.Socket): void {
        const messageString = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client !== sender) {
                client.write(messageString);
            }
        });
    }

    private SendBlockchainToClient(socket: net.Socket): void {
        const blockchainData = JSON.stringify({ /* blockchain data */ });
        socket.write(JSON.stringify({ type: 'syncBlockchain', data: blockchainData }));
    }

    private UpdateBlockchain(data: any): void {
        console.log('Received blockchain data for sync:', data);
        // Logic to update the blockchain state with the received data.
    }

    public Start(): void {
        this.server.listen(this.port, () => {
            console.log(`Node listening on port ${this.port}`);
        });

        this.server.on('error', (err) => {
            console.error('Server error:', err);
        });
    }

    public ConnectToPeer(host: string, port: number): void {
        const client = new net.Socket();
        client.connect(port, host, () => {
            console.log(`Connected to peer at ${host}:${port}`);
            this.peers[`${host}:${port}`] = client;
        });

        client.on('data', (data) => {
            try {
                const message: BlockchainMessage = JSON.parse(data.toString());
                console.log('Received from peer:', message);
                this.HandleMessage(message, client);
            } catch (err) {
                console.error('Error parsing message from peer:', err);
            }
        });

        client.on('error', (err) => {
            console.error(`Error with peer ${host}:${port}`, err);
        });

        client.on('end', () => {
            console.log(`Disconnected from peer at ${host}:${port}`);
            delete this.peers[`${host}:${port}`];
        });
    }

    public SendMessageToPeer(message: BlockchainMessage, host: string, port: number): void {
        const peer = this.peers[`${host}:${port}`];
        if (peer) {
            peer.write(JSON.stringify(message));
        } else {
            console.error(`No connection to peer at ${host}:${port}`);
        }
    }

    public Stop(): void {
        this.server.close(() => {
            console.log('Server stopped');
        });

        Object.values(this.peers).forEach((peer) => {
            peer.end();
        });
    }
}


export default P2PNode;