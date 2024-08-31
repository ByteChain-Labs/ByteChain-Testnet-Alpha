const Contract = require('../core/contract');
const Node = require('../core/node');
const Transaction = require('../core/transaction')

const fs = require('fs');
const path = require('path')

const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

const node = new Node();

// const miningTimer = 10000;

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

app.post('/add-new-contract', (req, res) => {
    const { contract, publicKey } = req.body;

    if (!!contract || !publicKey) {
        return res.status(400).json({ message: 'Incomplete request data' });
    }

    if (!contract.code || !contract.fromAddress || !contract.signature) {
        return res.status(400).json({ message: 'Incomplete contract data' });
    }

    const newContract = new Contract(
        contract.code,
        contract.fromAddress,
        contract.signature
    )

    const pathFile = contract.code.tokenSymbol;
    const dirPath = path.join(__dirname, '../contracts');
    const filePath = path.join(__dirname, `../contracts/${pathFile}.js`);
    const fileContent = contract.code;

    fs.mkdir(dirPath, {recursive: true}, (err) => {
        if (err) {
            return console.error('Error creating directory:', err);
        }
    });

    fs.writeFile(filePath, fileContent, (err) => {
        if (err) {
            return console.error('Error writing to file:', err);
        }
    });

    try {
        node.AddContract(newContract, publicKey);
        res.status(201).json({ message: 'Contract added successfully' });
    } catch (error) {
        console.error('Error adding contract:', error);
        res.status(500).json({ message: 'Failed to add contract', error: error.message });
    }

    node.ExecuteSmartContract(fileName);
});

app.get('/mine', (req, res) => {
    try {
        node.Mine();
        res.status(200).json({ message: 'Block mined successfully' });
    } catch (error) {
        console.error('Error mining block:', error);
        res.status(500).json({ message: 'Failed to mine block', error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});