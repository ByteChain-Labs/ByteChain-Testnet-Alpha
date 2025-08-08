import { hash_tostr } from "../utils/crypto.js";

function convert_tostr<T>(data: T): string {
    return typeof data === "object" ? JSON.stringify(data) : String(data);
}

function calc_merkleroot<T>(data_arr: T[]): string {
    if (data_arr.length === 0) return hash_tostr(convert_tostr(Date.now()));

    let hashed_dataarr = data_arr.map(data => hash_tostr(convert_tostr(data)));

    while (hashed_dataarr.length > 1) {
        if (hashed_dataarr.length % 2 !== 0) {
            hashed_dataarr.push(hashed_dataarr[hashed_dataarr.length - 1]);
        }

        const new_level: string[] = [];

        for (let i = 0; i < hashed_dataarr.length; i += 2) {
            new_level.push(hash_tostr(hashed_dataarr[i] + hashed_dataarr[i + 1]));
        }

        hashed_dataarr = new_level;
    }

    return hashed_dataarr[0];
}



export default calc_merkleroot;