//The transaction module! aka just an array formatter
var bitcoin = require('bitcoin'),
	events = require('events').EventEmitter,
	util = require('util');

var bclient = new bitcoin.Client({
	host: 'localhost',
	port: 18332,
	user: 'bitcoinrpc',
	pass: 'lolcake'
});

function transaction(currency, hash) {
	var self = this;
	this.confirmations = 0;
	this.amount = 0;
	this.txid = hash || '';
	this.address = '';
	this.category = '';
	this.raw;

	if (currency == "btc") {
		bclient.getTransaction(hash, function(err, data) {
			if (err) {
				console.log(err);
			} else {
				if (isset(data)) {
					if (data === null || isset(data.code)) {
						console.log('Could not connect while proccessing: ' + hash);
						if (data !== null) {
							console.log('Error: ' + data.code);
						}

					} else {
						self.confirmations = data.confirmations;
						self.amount = data.amount;
						self.category = data.category;
						self.address = data.details.address;
						self.raw = data;
						if(confirmations >= 0 || data.category == "receive"){
							self.emit('new');
						}
						
					}
				}

			}
		});
	}
}
util.inherits(transaction, events);

function isset() {
	// http://kevin.vanzonneveld.net
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: FremyCompany
	// +   improved by: Onno Marsman
	// +   improved by: Rafał Kukawski
	// *     example 1: isset( undefined, true);
	// *     returns 1: false
	// *     example 2: isset( 'Kevin van Zonneveld' );
	// *     returns 2: true

	var a = arguments,
		l = a.length,
		i = 0,
		undef;

	if (l === 0) {
		throw new Error('Empty isset');
	}

	while (i !== l) {
		if (a[i] === undef || a[i] === null) {
			return false;
		}
		i++;
	}
	return true;
}
module.exports = transaction;