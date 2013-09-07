var walletnotify = require('./libs/walletnotify.js'),
	blocknotify = require('./libs/blocknotify.js'),
	database = require('./libs/database.js'),
	transaction = require('./libs/transaction.js'),
	api = require('./libs/api.js'),
	fs = require('fs'),
	config = require('./config.js'),
	address = require('./libs/address.js'),
	send = require('./libs/send.js'),
	rate = require('./libs/rate.js'),
    pending = require('./libs/pending.js');


//setting up our services
database = new database();
api = new api(config.ports.api);
walletnotify = new walletnotify(config.ports.wnotify, pending);
blocknotify = new blocknotify(config.ports.bnotify, pending);

walletnotify.on('received', function(type){
	console.log('Received call for ' + type);
});
blocknotify.on('received', function(){
	console.log('Block');
});

//Dealing with api requests for a bitcoin address

api.on('request', function(from, to, rec, res) {
	generateAddresses(from, to, function(err, inputAddy, outputAddy) {
		if (err) {
			res.send(500, 'INTERNAL ERROR');
		} else {
			createRow(inputAddy, outputAddy, rec, from, to, function(err) {
				if (err) {
					res.send(500, 'INTERNAL ERROR');
				} else {
					res.jsonp({
						address: inputAddy,
						sendfrom: outputAddy
					});
				}
			});
		}
	});

});

function createRow(input, output, receiver, from, to, callback) {
	database.create(input, output, receiver, from, to, function(err) {
		if (err) {
			console.log('database add err: ' + err);
			callback(true);
		} else {
			callback(false);
		}
	});
}

function generateAddresses(from, to, callback) {
	address(from, function(err, input) {
		if (err) {
			console.log('generate address #1 err: ' + err);
			callback(true);
		} else {
			address(to, function(err, output) {
				if (err) {
					console.log('generate address #1 err: ' + err);
					callback(true);
				} else {
					callback(false, input, output);
				}
			});
		}
	});
}

//handling the events for when a transaction becomes confirmed and needs to be processed
walletnotify.on('payment', function(txn) {
	received(txn);
});
blocknotify.on('payment', function(txn) {
	received(txn);
});

function received(txn) {
	database.row(txn.address, function(err, row) {
		if (err) {
			console.log('COULDNT PROCESS ' + txn.txid);
			console.log('DB ERROR: ' + err);
		} else {
			var address, currency, otherCurrency;
			if (row == false) {
				console.log('unconnected receive ' + txn.txid);
				return false;
			} else if (row.input == txn.address) {
				address = row.receiver;
				currency = row.tocurrency;
				otherCurrency = row.fromcurrency;
			} else if (row.output == txn.address) {
				address = row.sender;
				currency = row.fromcurrency;
				otherCurrency = row.tocurrency;
			}
			rate(otherCurrency, currency, function(err, conversionRate) {
				if (err) {
					console.log('Exchange error: ' + err);
				} else {
					if (config.fee > 1) {
						fee = 1;
						console.log('Watch out the fee takes 100% of transaction!');
					} else if (config.fee > .25) {
						fee = config.fee;
						console.log('Fee takes more than 25% of transaction!');
					} else {
						fee = config.fee;
					}
					var sendAmount = txn.amount * conversionRate * (1 - fee);

					console.log('sending ' + sendAmount + ' ' + currency + ' to ' + address + ' after initial ' + txn.amount + ' ' + otherCurrency);
					send(currency, address, txn.amount * conversionRate * (1 - fee) );
				}
			});

		}
	});
}
