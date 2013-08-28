//The wallet!

var bitcoin = require('bitcoin'),
	config = require('./../config.js');

var bclient = new bitcoin.Client({
	host: config.wallet.btc.host,
	port: config.wallet.btc.port,
	user: config.wallet.btc.username,
	pass: config.wallet.btc.password
});

function send(currency, address, amount) {
	if (currency == "btc") {
		bclient.sendToAddress(address, amount, function(err) {
			if (err) {
				console.log('send fail: ' + err);
			} else {
				console.log('Sent ' + amount + ' ' + currency + ' to ' + address);
			}
		});
	}
}

module.exports = send;