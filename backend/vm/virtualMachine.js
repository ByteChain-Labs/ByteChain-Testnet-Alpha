const fs = require('fs');
const vm = require('vm');
const path = require('path')
 
 const BlockChain = require('../core/blockchain')
 
 const bytechain = new BlockChain()
 //             TODO TODO TODO

class VirtualMachine {
    constructor(filename) {
        this.blockchain = bytechain;
        this.state = {};
        this.filename = filename
    }

    ExecuteContract() {
        fs.readFile(path.join(__dirname, `../contracts/${this.filename}.js`), 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            
            try {
                const output = eval(data);
                // console.log(output)
                this.state = output
            } catch (err) {
                console.log(err)
            }
        });
    }
}


module.exports = VirtualMachine;