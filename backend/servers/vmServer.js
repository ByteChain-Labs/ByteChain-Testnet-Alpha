const Contract = require('../core/contract'); 

const express = require('express');
const { default: axios } = require('axios');

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/create-contract', async (req, res) => {
    const { fileName, code, fromAddress, publicKey, privateKey } = req.body;

    if (!fileName || !code || !fromAddress || !privateKey || !publicKey) {
        res.status(400).json({
            message: 'Please provide all required fields'
        })
    }

    const signature = Contract.SignContract(code, fromAddress, privateKey)

    const contract = new Contract(code, fromAddress, signature);

    const contractReq = { fileName, contract, publicKey }

    try {
        await axios.post('http://localhost:3000/add-new-contract', contractReq)

        res.status(201).json({ message: 'Contract sent successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Contract not sent: ', error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})