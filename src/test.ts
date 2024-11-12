import Wallet from "./accounts/wallet";
import * as discover from './network/discover'

const w = new Wallet();

console.log(discover.AdvertiseNode(w.account.privateKey));