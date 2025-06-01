import { randomBytes } from 'crypto';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { bytesToHex, hexToBytes } from '@ethereumjs/util';
import base58 from 'bs58';
import BigNumber from 'bignumber.js';
import Transaction from '../core/transaction';
import BlockChain from '../core/blockchain';
import { ADDRESS_VERSION_BYTE, BYTECHAIN_COIN_TYPE } from '../utils/core_constants';

import * as bip39 from 'bip39';
import HDKey from 'hdkey';

class Account {
    private priv_key: string;
    pub_key: string;
    blockchain_addr: string;
    private n_nonce: number;
    mnemonic?: string;
    derivation_path?: string;

    constructor(private readonly blockchainInstance: BlockChain, options?: {
        priv_key?: string;
        mnemonic?: string;
        path?: string;
        mnemonic_passphrase?: string;
    }) {
        let privateKeyBytes: Uint8Array;

        if (options?.mnemonic) {
            if (!bip39.validateMnemonic(options.mnemonic)) {
                throw new Error("Invalid mnemonic phrase provided.");
            }
            this.mnemonic = options.mnemonic;
        
            const seed = bip39.mnemonicToSeedSync(options.mnemonic, options.mnemonic_passphrase);

            const hdkey = HDKey.fromMasterSeed(Buffer.from(seed));

            this.derivation_path = options.path || `m/44'/${BYTECHAIN_COIN_TYPE}'/0'/0/0`;

            const childKey = hdkey.derive(this.derivation_path);

            if (!childKey.privateKey) {
                throw new Error("Could not derive private key from mnemonic and path.");
            }
            privateKeyBytes = childKey.privateKey;
            this.priv_key = bytesToHex(privateKeyBytes);

        } else if (options?.priv_key) {
            this.priv_key = options.priv_key;
            privateKeyBytes = hexToBytes(`0x${this.priv_key}`);

        } else {
            privateKeyBytes = secp256k1.utils.randomPrivateKey();
            this.priv_key = bytesToHex(privateKeyBytes);

            const entropy = randomBytes(16);
            this.mnemonic = bip39.entropyToMnemonic(bytesToHex(entropy));
            this.derivation_path = `m/44'/${BYTECHAIN_COIN_TYPE}'/0'/0/0`;
        }

        this.pub_key = Account.create_pub_key(this.priv_key);
        this.blockchain_addr = Account.create_blockchain_addr(this.pub_key);

        this.n_nonce = this.blockchainInstance.addr_nonce.get(this.blockchain_addr) ?? 0;
    }

    static generateMnemonic(strength: 128 | 160 | 192 | 224 | 256 = 128): string {
        return bip39.generateMnemonic(strength);
    }

    static fromMnemonic(
        blockchainInstance: BlockChain,
        mnemonic: string,
        path?: string,
        mnemonic_passphrase?: string
    ): Account {
        return new Account(blockchainInstance, { mnemonic, path, mnemonic_passphrase });
    }

    static fromPrivateKey(blockchainInstance: BlockChain, privKeyHex: string): Account {
        return new Account(blockchainInstance, { priv_key: privKeyHex });
    }

    // Generates the public key from a private key
    static create_pub_key(priv_key: string): string {
        const privateKeyBytes = hexToBytes(`0x${priv_key}`);
        const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);
        return bytesToHex(publicKeyBytes);
    }

    // Creates a blockchain address from the public key
    static create_blockchain_addr(pub_key: string): string {
         const pubKeyBytes = hexToBytes(`0x${pub_key}`);
        const sha256Hash = sha256(pubKeyBytes);
        const ripemd160Hash = ripemd160(sha256Hash);

        const versionByte = Buffer.from([ADDRESS_VERSION_BYTE]);
        const payload = Buffer.concat([versionByte, Buffer.from(ripemd160Hash)]);

        const checksum = Buffer.from(sha256(sha256(payload))).slice(0, 4);

        const finalPayload = Buffer.concat([payload, checksum]);
        const blockchain_addr = base58.encode(finalPayload);
        
        return blockchain_addr;
    }

    // Allow all accounts to be able to sign transaction
    sign_tx(recipient: string, amount: BigNumber, fee: BigNumber): Transaction {
        try {
            const currentConfirmedNonce = this.blockchainInstance.addr_nonce.get(this.blockchain_addr) ?? 0;
            const nextNonce = currentConfirmedNonce + 1;

            const tx = new Transaction(this.blockchain_addr, recipient, amount, fee, nextNonce);

            const dataToSign = tx.getSignableData();
            const dataToSignHashBytes = sha256(Buffer.from(dataToSign, 'utf8'));

            const privateKeyBytes = hexToBytes(`0x${this.priv_key}`);

            const signature = secp256k1.sign(dataToSignHashBytes, privateKeyBytes);

            const r_hex = bytesToHex(signature.r);

            const s_hex = bytesToHex(signature.s);
            const v_hex = signature.recovery !== null ? signature.recovery.toString(16).padStart(2, '0') : '00';

            const fullSignature = r_hex + s_hex + v_hex;

            tx.signature = fullSignature;

            return tx;
        } catch (err) {
            console.error(`Error signing transaction for ${this.blockchain_addr}:`, (err as Error).message);
            throw new Error('Unable to sign transaction');
        }
    }
    
    get currentBalance(): BigNumber {
        return this.blockchainInstance.addr_bal.get(this.blockchain_addr) || new BigNumber(0);
    }
}


export default Account;
