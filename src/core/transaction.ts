import BigNumber from 'bignumber.js';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@ethereumjs/util';
import Account from '../accounts/account';

class Transaction {
    id: string;
    sender: string;
    recipient: string;
    amount: BigNumber;
    fee: BigNumber;
    signature: string;
    nonce: number;
    timestamp: number;

    constructor(sender: string, recipient: string, amount: BigNumber, fee: BigNumber, nonce: number, signature: string = ''
    ) {
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.fee = fee;
        this.nonce = nonce;
        this.signature = signature;
        this.timestamp = Date.now();
        this.id = this.calculateHash();
    }

    getSignableData(): string {
        return [
            this.sender,
            this.recipient,
            this.amount.toFixed(),
            this.fee.toFixed(),
            this.nonce.toString(),
            this.timestamp.toString()
        ].join('|');
    }

    calculateHash(): string {
        const dataToHash = Buffer.from(this.getSignableData(), 'utf8');
        return bytesToHex(sha256(dataToHash));
    }

    verifySignature(): boolean {
        try {
            if (!this.sender || !this.signature || !this.amount || !this.fee ||
                typeof this.nonce !== 'number' || typeof this.timestamp !== 'number') {
                console.error("TX Verification Error: Incomplete transaction data for signature check.");
                return false;
            }

            const messageHashBytes = sha256(Buffer.from(this.getSignableData(), 'utf8'));

            if (this.signature.length !== 130) {
                console.error(`TX Verification Error: Invalid signature format length (${this.signature.length}).`);
                return false;
            }

            const r_hex = this.signature.substring(0, 64);
            const s_hex = this.signature.substring(64, 128);
            const v_hex = this.signature.substring(128, 130);

            const r_bytes = hexToBytes(`0x${r_hex}`);
            const s_bytes = hexToBytes(`0x${s_hex}`);
            const recoveryId = parseInt(v_hex, 16);

            const sig = secp256k1.Signature.fromCompact(Buffer.concat([r_bytes, s_bytes])).addRecoveryBit(recoveryId);

            const recoveredPubKeyBytes = sig.recoverPublicKey(messageHashBytes).toRawBytes(false);
            const recoveredPubKeyHex = bytesToHex(recoveredPubKeyBytes);

            const recoveredAddress = Account.create_pub_key(recoveredPubKeyHex);

            if (recoveredAddress !== this.sender) {
                console.error(`TX Verification Error: Recovered address (${recoveredAddress}) does not match sender (${this.sender}).`);
                return false;
            }

            const isValid = secp256k1.verify(sig, messageHashBytes, recoveredPubKeyBytes);
            if (!isValid) {
                console.error("TX Verification Error: secp256k1.verify method returned false.");
                return false;
            }

            return true;
        } catch (err) {
            console.error(`TX Signature Verification Failed unexpectedly for TX ID ${this.id || 'unknown'}:`, (err as Error).message);
            return false;
        }
    }

    isValid(): boolean {
        try {
            if (!this.id || !this.sender || !this.recipient || !this.signature ||
                typeof this.nonce !== 'number' || typeof this.timestamp !== 'number' ||
                !this.amount || !this.fee || this.amount.isNaN() || this.fee.isNaN() ||
                this.amount.isNegative() || this.fee.isNegative() || this.nonce < 0) {
                console.error("TX Validation Error: Missing, invalid, or negative essential fields.");
                return false;
            }

            if (this.id !== this.calculateHash()) {
                console.error(`TX Validation Error: ID mismatch. Stored: ${this.id}, Calculated: ${this.calculateHash()}`);
                return false;
            }

            const currentTime = Date.now();
            const MAX_TIME_DIFF_MS = 5 * 60 * 1000;
            if (Math.abs(currentTime - this.timestamp) > MAX_TIME_DIFF_MS) {
                console.error(`TX Validation Error: Timestamp out of range. Current: ${currentTime}, TX: ${this.timestamp}`);
                return false;
            }

            if (!this.verifySignature()) {
                console.error("TX Validation Error: Signature verification failed.");
                return false;
            }

            return true;
        } catch (err) {
            console.error(`TX Validation Failed unexpectedly for TX ID ${this.id || 'unknown'}:`, (err as Error).message);
            return false;
        }
    }

    serialize(): string {
        const parts: string[] = [
            this.id,
            this.sender,
            this.recipient,
            this.amount.toFixed(),
            this.fee.toFixed(),
            this.nonce.toString(),
            this.timestamp.toString(),
            this.signature
        ];
        return parts.join('|');
    }

    static deserialize(serializedTx: string): Transaction {
        const parts = serializedTx.split('|');
        if (parts.length !== 8) {
            throw new Error(`Invalid serialized transaction format. Expected 8 parts, got ${parts.length}.`);
        }

        const [id, sender, recipient, amountStr, feeStr, nonceStr, timestampStr, signature] = parts;

        const amount = new BigNumber(amountStr);
        if (amount.isNaN()) {
            throw new Error("Deserialization Error: Invalid amount in serialized transaction.");
        }

        const fee = new BigNumber(feeStr);
        if (fee.isNaN()) {
            throw new Error("Deserialization Error: Invalid fee in serialized transaction.");
        }

        const nonce = parseInt(nonceStr, 10);
        if (isNaN(nonce)) {
            throw new Error("Deserialization Error: Invalid nonce in serialized transaction.");
        }

        const timestamp = parseInt(timestampStr, 10);
        if (isNaN(timestamp)) {
            throw new Error("Deserialization Error: Invalid timestamp in serialized transaction.");
        }

        const tx = new Transaction(sender, recipient, amount, fee, nonce, signature);
        tx.timestamp = timestamp;
        tx.id = id;

        if (tx.calculateHash() !== id) {
            throw new Error("Deserialization Error: Transaction ID mismatch. Data integrity compromised.");
        }

        return tx;
    }
}


export default Transaction;