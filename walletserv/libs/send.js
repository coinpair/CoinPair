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

function send(currency, address, amount) {
	if (currency == "btc") {
		standardSend(bclient, address, amount);
	}
	else if (currency == "ltc") {
		standardSend(lclient, address, amount);
	}
}

function standardSend(client, address, amount) {
	client.sendToAddress(address, amount, function(err) {
		if (err) {
			console.log('send fail: ' + err);
		} else {
			console.log('Sent ' + amount + ' ' + currency + ' to ' + address);
		}
	});
}
module.exports = send;