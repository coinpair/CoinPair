//The wallet!

var config = require('./../config.js'),
	net = require('net'),
	events = require('events').EventEmitter,
	util = require('util');

var testing = {}

testing.faketxn = function() {
	var txn = {}

	txn.confirmations = 0;
	txn.amount = 0.8872217089;
	txn.txid = '1234txid';
	txn.address = '1234originaddy';
	txn.toAddress = '1234outaddy';
	txn.category = '';
	txn.currency = 'btc';
	txn.from = 'btc'
	txn.to = 'btc';


	return txn;
}

testing.fakeGetTxn = function(callback) {
	var self = this;
	var server = net.createServer(function(c) { //'connection' listener
		c.on('data', function(data) {
			var str = data.toString();
			var json;
			try {
				json = JSON.parse(str);
			} catch (e) {
				// invalid json input, set to null
				json = null
			}
			if (json == null) {
				console.log('Error parsing: ' + str);
			} else {
				self.emit('data', json);
			}
		});

	});

	server.listen(config.ports.test);
}

util.inherits(testing.fakeGetTxn, events);
module.exports = testing;