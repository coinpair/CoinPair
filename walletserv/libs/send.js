//The wallet!

var wallet = require('../libs/wallet.js'),
	config = require('./../config.js');
wallet = new wallet();

function send(currency, address, amount, callback, ignore) {

	if (typeof ignore === 'undefined') ignore = false;
	var client = wallet.find(currency);
	if (client == false) {
		callback('Couldnt use specified currency wallet! (most likely not setup in config?');
	} else {
		standardSend(client, address, amount, function(err, success) {
			callback(err);
		}, ignore);
	}
}

function standardSend(client, address, amount, callback, ignore) {

	if (!config.test || ignore) {
		client.sendToAddress(address, amount, function(err) {
			if (err) {
				callback(err, false);
			} else {
				console.log('[WALLET] Sent ' + amount + ' to ' + address);
				callback(false, true);
			}
		});
	} else {
		console.log('[test call] Sending ' + amount + ' to ' + address);
		callback(false, true);
	}
}
module.exports = send;