//The wallet!

var config = require('./../config.js');

var testing = {}

testing.faketxn = function(){
	var txn = {}

	txn.confirmations = 0;
	txn.amount = 1.24;
	txn.txid = '1234txid';
	txn.address = '1234originaddy';
	txn.toAddress = '1234outaddy';
	txn.category = '';
	txn.currency = 'btc';
	txn.from = 'btc'
	txn.to = 'btc';


	return txn;
}

module.exports = testing;