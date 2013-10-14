var config = require('./../config.js'),
	bitcoin = require('bitcoin');


function wallet() {
	this.wallets = [];
	var self = this;
	for (var i = 0; i < config.allow.from.length; i++) {
		var element = config.allow.from[i];

		var client = new bitcoin.Client({
			host: config.wallet[element].host,
			port: config.wallet[element].port,
			user: config.wallet[element].username,
			pass: config.wallet[element].password
		});
		self.wallets.push({
			type: element,
			client: client
		});
	}
	this.find = function(currency) {
		currency = currency.toLowerCase();
		for (var i = 0; i < self.wallets.length; i++) {
			var element = self.wallets[i];
			if (element.type == currency) return element.client;

		}
		return false;
	}
}

module.exports = wallet;