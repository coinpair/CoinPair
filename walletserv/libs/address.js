//The walletnotify module!

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

function address(type, callback) {
	if (type == 'btc') {
		bclient.getNewAddress(function(err, address) {
			if (err) {
				callback(err);
			} else {
				callback(false, address);
			}
		});
	} else if (type == 'ltc') {
		lclient.getNewAddress(function(err, address) {
			if (err) {
				callback(err);
			} else {
				callback(false, address);
			}
		});
	}
}



module.exports = address;