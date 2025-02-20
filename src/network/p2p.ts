import { WebSocket } from "ws";

//Using arbitrary port for now.
const ws = new WebSocket.Server({ port: 3000 });

// Loop through every peer in peers.txt and establish a connection.