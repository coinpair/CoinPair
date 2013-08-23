//The transaction module! aka just an array formatter

var fs = require('fs'),
	mkdirp = require('mkdirp'),
	bitcoin = require('bitcoin'),
	events = require('events').EventEmitter,
	util = require('util');

var bclient = new bitcoin.Client({
	host: 'localhost',
	port: 8332,
	user: 'bitcoinrpc',
	pass: 'lolcake'
});

function transaction(currency, hash, stored) {
	var self = this;
	this.confirmations = 0;
	this.amount = 0;
	this.txid = hash || '';
	this.address = '';
	this.category = '';
	this.raw;
	if (typeof stored === undefined) {
		stored = false;
	}

	if (currency == "btc") {
		bclient.getTransaction(hash, function(err, data) {
			if (err) {
				console.log('Get transaction err: ' + err);
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
						self.category = data.details[0].category;
						self.address = data.details[0].address;
						self.raw = data;

						//Checking if confirmation is not zero, and the amount is less than the total mined for x confirms

						if (self.category == 'receive') {

							if (self.confirmations <= 1 && self.amount < 25) {
								if (self.confirmations == 1) {
									self.complete();
									console.log('Small confirm!');
								}
							} else {
								if (self.confirmations == 1) {
									store(self.txid);
								} else if (self.confirmations >= 6 || (self.confirmations > 1 && self.amount < self.confirmations * 25)) {
									if (stored) {
										console.log('Deleting!');
										unstore(self.txid, function() {
											self.complete();
											console.log('Big confirm!');
										});
									} else {
										self.complete();
										console.log('big confirm w/ no delete');
									}
								}
							}


						}
					}
				}

			}
		});
	}

	this.complete = function(){
		self.emit('new');
	}

}


util.inherits(transaction, events);

function unstore(hash, callback) {
	var dir = "./unconfirmed/btc";

	fs.unlink(dir + '/' + hash + ".txt", hash, function(err) {
		if (err) {
			console.log("Could not delete transaction " + hash);
			throw new Error("Transaction not deleted!")

		} else {
			console.log('Unstore ' + hash);
			callback();
		}
	});
}

function store(hash) {
	var dir = "./unconfirmed/btc";

	mkdirp(dir, function(err) {
		if (err) console.error('mkdir err: ' + err)
		else {
			fs.writeFile(dir + '/' + hash + ".txt", hash, function(err) {
				if (err) {
					console.log("Could not queue unconfirmed transaction " + hash);
					console.log(err);
				} else {
					console.log('Stored ' + hash);
				}
			});
		}
	});
}

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