import BlockChain from "./core/blockchain";
import { print } from "./utils/core_constants";

const bytechain = new BlockChain();

bytechain.mine_block("abc");
bytechain.mine_block("abc");
bytechain.mine_block("abc");
bytechain.mine_block("abc");
bytechain.mine_block("abc");


print(bytechain.chain);
print(bytechain.addr_bal.get("abc"))