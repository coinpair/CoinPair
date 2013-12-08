var config = require('./../config.js'),
	wallet = require('../libs/wallet.js'),
	events = require('events').EventEmitter,
	util = require('util'),
	stored = require('../libs/stored.js'),
	bitcoin = require('bitcoin'),
	testing = require('../libs/test.js'),
	winston = require('winston');

function txnManager(logic) {
	var self = this;
	this.table = [];
	wallet = new wallet(),
	stored = new stored();
	var testReply;
	if (config.test) testReply = new testing.fakeGetTxn();

	this.update = function(hash, currency, notification) {
		if (typeof notification === 'undefined') {
			notification = false
		}
		if (config.test) {
			testReply.on('data', function(data) {
				if (config.test) winston.log('dev', 'confirms: ' + data.confirmations);
				self.process(hash, currency, data, false);
			});
		} else {
			var client = wallet.find(currency);

			if (client) {
				client.getTransaction(hash, function(err, data) {
					self.process(hash, currency, data, notification, err);
				});
			} else {
				self.emit('error', 'Couldnt get wallet, not specified in settings?');
			}
		}
	}
	this.find = function(address) {
		var all = [];
		for (var i = 0; i < self.table.length; i++) {
			var element = self.table[i];

			if (element.address == address) all.push(element);
		}
		return all;
	}
	this.add = function(txn) {
		var array = self.table;
		var found = false,
			newly = true;
		for (var i = 0; i < array.length; i++) {
			if (array[i].txid == txn.txid) {
				array.splice(i, 1);
				newly = false;
			}
		}

		array.push(txn);

		self.emit('update', txn);

		if (config.test) winston.log('dev', array);
		return newly;
	}
	this.remove = function(txn) {
		var array = self.table;
		for (var i = 0; i < array.length; i++) {
			if (array[i].txid == txn.txid) {
				array.splice(i, 1);
			}
		}
		if (config.test) winston.log('dev', array);
	}

	this.process = function(hash, currency, data, notification, err) {

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
			self.add(txn);
			if (notification) {
				self.emit('new', txn);
			}
			logic(txn, function(process, remove) {
				if (remove) {
					self.remove(txn);
				} else {
					if (process) {
						self.remove(txn);
						self.emit('payment', txn);
					}
				}

			});
		}

	}
}

function objectify(hash, confirms, amount, category, address, currency) {
	var txn = {
		txid: hash,
		confirmations: confirms,
		amount: amount,
		currency: currency,
		category: category,
		address: address
	}
	return txn;
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