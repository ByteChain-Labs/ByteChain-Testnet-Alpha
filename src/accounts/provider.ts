import Transaction from "../core/transaction.js";


class Provider {
    constructor(private rpc_url: string) {}

    async check_nonce(addr: string): Promise<number> {
        const res = await fetch(`${this.rpc_url}/nonce/${addr}`);
        const n_nonce = (await res.json()).nonce;
        return n_nonce;
    }

    async check_balance(addr: string): Promise<number> {
        const res = await fetch(`${this.rpc_url}/balance/${addr}`);
        const acc_bal = (await res.json()).balance;
        return acc_bal;
    }

    async send_tx(tx: Transaction): Promise<string> {
        const res = await fetch(
            `${this.rpc_url}/tx/send`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tx)
            }
        );
        const tx_hash = (await res.json()).tx_id;
        return tx_hash;
    }
}


export default Provider;