import express, { Request, Response } from 'express';
import Node from '../core/node';
import Transaction from '../core/transaction';

const app = express();
const node = new Node();

const port: number = Number(process.env.PORT) || node.port;
const TIMER = 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to get the blockchain
app.get('/blockchain', (req: Request, res: Response) => {
    res.status(200).send(node.blockchain.chain);
});

// Route to get the transaction pool
app.get('/transactions', (req: Request, res: Response) => {
    res.status(200).send(node.blockchain.transactionPool);
});

// Route to add a new transaction
app.post('/add-new-transaction', (req: Request, res: Response) => {
    const { transaction, publicKey }: { transaction: any, publicKey: string } = req.body;

    if (!transaction || !publicKey) {
        return res.status(400).json({ message: 'Incomplete request data' });
    }

    if (!transaction.amount || !transaction.sender || !transaction.recipient || !transaction.signature) {
        return res.status(400).json({ message: 'Incomplete transaction data' });
    }

    const newTransaction = new Transaction(
        transaction.amount,
        transaction.sender,
        transaction.recipient,
        transaction.signature
    );

    try {
        node.AddTransaction(newTransaction, publicKey);
        res.status(201).json({ message: 'Transaction added successfully' });
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ message: 'Failed to add transaction', error: (error as Error).message });
    }
});

// Timer to start mining at regular intervals
setInterval(() => {
    try {
        node.StartMining();
        console.log('Block mined successfully');
    } catch (error) {
        console.error('Error mining block:', error);
    }
}, TIMER);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
