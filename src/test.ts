import crypto from 'crypto';
import Account from './accounts/account';

const account = new Account();

console.log(crypto.createSign('SHA256').sign.toString());