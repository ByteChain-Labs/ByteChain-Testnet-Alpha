import * as net from 'net';
import { BlockchainMessage } from '../utils/core_constants';

class TCPServer {
    private server: net.Server;
    private port: number;
    private clients: net.Socket[] = [];

    constructor(port: number) {
        this.port = port;
        this.server = net.createServer(this.HandleConnection.bind(this));
    }

    private HandleConnection(socket: net.Socket): void {
        console.log('New client connected:', socket.remoteAddress);
        this.clients.push(socket);

        socket.on('data', (data) => {
            try {
                const message: BlockchainMessage = JSON.parse(data.toString());
                console.log('Received message:', message);

                switch (message.type) {
                    case 'newTransaction':
                        this.BroadcastMessage(message, socket);
                        break;
                    case 'newBlock':
                        this.BroadcastMessage(message, socket);
                        break;
                    case 'requestBlockchain':
                        this.SendBlockchainToClient(socket);
                        break;
                    case 'syncBlockchain':
                        this.UpdateBlockchain(message.payload);
                        break;
                    default:
                        console.log('Unknown message type');
                }
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        });

        socket.on('end', () => {
            console.log('Client disconnected');
            this.clients = this.clients.filter((client) => client !== socket);
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
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
        console.log('Blockchain data received for sync:', data);
        // Update the blockchain state with the received data.
    }

    public Start(): void {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}`);
        });

        this.server.on('error', (err) => {
            console.error('Server error:', err);
        });
    }

    public Stop(): void {
        this.server.close(() => {
            console.log('Server stopped');
        });
    }
}

class TCPClient {
    private client: net.Socket;
    private host: string;
    private port: number;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
        this.client = new net.Socket();

        this.client.connect(this.port, this.host, () => {
            console.log(`Connected to server at ${this.host}:${this.port}`);
        });

        this.client.on('data', (data) => {
            const message: BlockchainMessage = JSON.parse(data.toString());
            console.log('Received from server:', message);

            if (message.type === 'syncBlockchain') {
                this.UpdateBlockchain(message.payload);
            }
        });

        this.client.on('end', () => {
            console.log('Disconnected from server');
        });

        this.client.on('error', (err) => {
            console.error('Client error:', err);
        });
    }

    public SendMessage(message: BlockchainMessage): void {
        const messageString = JSON.stringify(message);
        console.log('Sending:', message);
        this.client.write(messageString);
    }

    private UpdateBlockchain(data: any): void {
        console.log('Updating blockchain with received data:', data);
        //Merge the received blockchain data with the local state.
    }

    // public RequestBlockchainSync(): void {
    //     this.SendMessage({ type: 'requestBlockchain', payload: BlockChain });
    // }

    public Disconnect(): void {
        this.client.end();
    }
}


export { TCPServer, TCPClient };