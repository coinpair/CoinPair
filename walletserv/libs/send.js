//The wallet!

var bitcoin = require('bitcoin'),
	config = require('./../config.js');

var bclient = new bitcoin.Client({
	host: config.wallet.btc.host,
	port: config.wallet.btc.port,
	user: config.wallet.btc.username,
	pass: config.wallet.btc.password
});

var lclient = new bitcoin.Client({
	host: config.wallet.ltc.host,
	port: config.wallet.ltc.port,
	user: config.wallet.ltc.username,
	pass: config.wallet.ltc.password
});

function send(currency, address, amount, callback, ignore) {
	if (typeof ignore === 'undefined') ignore = false;
	if (currency == "btc") {
		standardSend(bclient, address, amount, function(err, success) {
			callback(err);
		}, ignore);
	} else if (currency == "ltc") {
		standardSend(lclient, address, amount, function(err, success) {
			callback(err, success);
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