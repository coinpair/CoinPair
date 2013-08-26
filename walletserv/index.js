var walletnotify = require('./libs/walletnotify.js'),
	blocknotify = require('./libs/blocknotify.js'),
	database = require('./libs/database.js'),
	api = require('./libs/api.js'),
	fs = require('fs'),
	config = require('./config.js'),
	address = require('./libs/address.js'),
	send = require('./libs/send.js');

database = new database();


api = new api(config.ports.api);
walletnotify = new walletnotify(config.ports.wnotify);
blocknotify = new blocknotify(config.ports.bnotify);

api.on('request', function(from, to, rec, res) {
	generateAddresses(from, to, function(err, inputAddy, outputAddy) {
		if (err) {
			res.send(500, 'INTERNAL ERROR');
		} else {
			createRow(inputAddy, outputAddy, rec, from, to, function(err) {
				if (err) {
					res.send(500, 'INTERNAL ERROR');
				} else {
					res.json({
						address: inputAddy,
						sendfrom: outputAddy
					});
				}
			});
		}
	});

});
walletnotify.on('payment', function(txn){
	received(txn);
});
blocknotify.on('payment', function(txn){
	received(txn);
});

function received(txn){
	console.log('Received!');
	database.row(txn.address, function(err, row){
		if(err){
			console.log('COULDNT PROCESS ' + txn.txid);
			console.log('DB ERROR: ' + err);
		}
		else {
			var opp;
			if(row == false){
				console.log('unconnected receive ' + txn.txid);
				return false;
			}
			else if(row.input == txn.address){
				console.log('Receive!');
				opp = [txn.output, txn.receiver];
			}
			else if(row.output == txn.address) {
				console.log('Reverse!');
				opp = [txn.input, txn.sender];
			}
			send('btc', opp[1], txn.amount);
		}
	});
}

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
