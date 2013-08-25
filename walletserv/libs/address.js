//The walletnotify module!

var bitcoin = require('bitcoin'),
	config = require('./../config.js');

var bclient = new bitcoin.Client({
	host: config.wallet.btc.host,
	port: config.wallet.btc.port,
	user: config.wallet.btc.username,
	pass: config.wallet.btc.password
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
	}
}



module.exports = address;