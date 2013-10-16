//The address module!

var wallet = require('../libs/wallet.js'),
	config = require('./../config.js');

function address(type, callback) {
	Wallet = new wallet();
	var client = Wallet.find(type);
	if (client) {
		client.getNewAddress(function(err, address) {
			if (err) {
				callback(err);
			} else {
				callback(false, address);
			}
		});
	} else {
		callback('Couldnt find specified wallet, not not setup in config?');
	}
}



module.exports = address;