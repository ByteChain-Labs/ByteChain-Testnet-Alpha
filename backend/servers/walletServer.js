const BlockChain = require('../core/blockchain');
const Transaction = require('../core/transaction');
const Wallet = require('../client/wallet');
const express = require('express');
const { default: axios } = require('axios');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3001;



const bytechain = new BlockChain();

app.use(cors({ origin: "http://localhost:4567"}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/create-new-wallet', (req, res) => {
    const walletUser = new Wallet();

    const privateKey = walletUser.privateKey;
    const publicKey = walletUser.publicKey;
    const blockchainAddress = walletUser.blockchainAddress;

    res.status(201).json({
        message: 'Do not share your private key with anyone',
        privateKey, 
        publicKey, 
        blockchainAddress
    });
});

app.post('/check-balance', (req, res) => {
    const { blockchainAddress } = req.body;

    if (!blockchainAddress) {
        return res.status(400).json({
            message: 'BlockChainAddress is required.'
        });
    }

    const balance = bytechain.CalculateBalance(blockchainAddress)
    res.status(200).json({ message: `Your balance is ${balance}`})
});

app.post('/create-transaction', async (req, res) => {
    const { amount, sender, recipient, privateKey, publicKey } = req.body;

    if (!amount || !sender || !recipient || !privateKey || !publicKey) {
        res.status(400).json({
            message: 'Please provide all required fields'
        })
    }
    
    const signature = Transaction.SignTransaction(amount, sender, recipient, privateKey)
    const transaction = new Transaction(amount, sender, recipient, signature);


    const trxReq = { transaction, publicKey }

    try {
        const response = await axios.post('http://localhost:3000/add-new-transaction', trxReq)
        console.log(`Transaction completed sucessfully \n BlockChain server responded with ${response.data}`);

        res.status(201).json({ message: 'Transaction completed successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    }
});


app.listen(port, () => {
    console.log('Server running on port 3001');
});
