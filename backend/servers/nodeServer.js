const Node = require('../core/node');
const Transaction = require('../core/transaction')


const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

const node = new Node();

const timer = 600000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/blockchain', (req, res) => {
    res.status(200).send(node.blockchain.chain);
});

app.get('/transactions', (req, res) => {
    res.status(200).send(node.blockchain.transactionPool);
});

app.post('/add-new-transaction', (req, res) => {
    const { transaction, publicKey } = req.body;

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
    )

    try {
        node.AddTransaction(newTransaction, publicKey);
        res.status(201).json({ message: 'Transaction added successfully' });
        
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ message: 'Failed to add transaction', error: error.message });
    }
});

setInterval(() => {
    try {
        node.Mine();
        res.status(200).json({ message: 'Block mined successfully' });
    } catch (error) {
        console.error('Error mining block:', error);
        res.status(500).json({ message: 'Failed to mine block', error: error.message });
    }
}, timer)


app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});