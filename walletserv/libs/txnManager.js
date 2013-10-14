var config = require('./../config.js'),
	wallet = require('../libs/wallet.js'),
	events = require('events').EventEmitter,
	util = require('util'),
	stored = require('../libs/stored.js'),
	bitcoin = require('bitcoin');

function txnManager(logic) {
	var self = this;
	this.table = [];
	wallet = new wallet(),
	stored = new stored();

	this.block = function(currency) {

		stored.refresh(currency, function(err, hash) {
			if (err) {
				self.emit('error', err);
			} else {
				self.update(hash, currency);
			}
		});
	}

	this.update = function(hash, currency) {

		var client = wallet.find(currency);

		if (client) {
			client.getTransaction(hash, function(err, data) {
				if (err) {
					self.emit('error', err);
					return;
				} else if (data === null || isset(data.code)) {
					self.emit('error', 'Could not connect while proccessing: ' + hash);
					if (data !== null) {
						self.emit('error', data.code);
					}
					return;

				}
				var txn = objectify(hash, data.confirmations, data.amount, data.details[0].category, data.details[0].address, currency);

				if (txn.category == 'receive') {

					logic(txn, function(wait) {
						if (wait) {
							if (add(txn, self.table)) self.emit('new', txn);
							self.emit('queued', txn);
							if (txn.confirmations >= 2) {
								stored.store(txn.hash, txn.currency, function(err) {
									if (err) self.emit('error', 'could not store ' + txn.hash + ' for processing');
								});
							}
						} else {
							stored.unstore(txn.hash, txn.currency, function(err) {
								if (err) throw new Error("Transaction not deleted!");
								else {
									remove(txn, self.table);
									self.emit('payment', txn);
								}
							});

						}
					});
				}
			});
		} else {
			self.emit('error', 'Couldnt get wallet, not specified in settings?');
		}



	}
	this.find = function(address) {
		for (var i = 0; i < self.table; i++) {
			var element = self.table[i];
			if (element.address == address) return element;
		}
		return false;
	}
}

function objectify(hash, confirms, amount, category, address, currency) {
	var txn = [];
	txn.txid = hash;
	txn.confirmations = confirms;
	txn.amount = amount;
	txn.currency = currency
	txn.category = category;
	txn.address = address;
	return txn;
}

function add(txn, array) {
	var found = false,
		newly = true;

	if (array.indexOf(txn != -1)) {
		array.splice(array.indexOf(found), 1);
		newly = false
	}

	array.push(txn);
	return newly;
}

function remove(txn, array) {
	if (array.indexOf(txn != -1)) array.splice(array.indexOf(found), 1);
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


util.inherits(txnManager, events);
module.exports = txnManager;