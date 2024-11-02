import Account from '../accounts/account';
import { TCPClient, TCPServer } from '../network/p2p';

class BCNode {
    CalculateBalance(blockchainAddress: Account['blockchainAddress']): number { return 20; };
}

export default BCNode;