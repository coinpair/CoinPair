//The transaction module! aka just an array formatter

var fs = require('fs'),
	mkdirp = require('mkdirp'),
	bitcoin = require('bitcoin'),
	events = require('events').EventEmitter,
	util = require('util'),
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

function transaction(tracker, database, currency, hash, stored) {
	var self = this;
	this.confirmations = 0;
	this.amount = 0;
	this.txid = hash || '';
	this.address = '';
	this.category = '';
	this.currency = currency;
	this.raw;
	if (typeof stored === undefined) {
		stored = false;
	}

	if (currency == "btc") {
		process(bclient, hash);
	} else if (currency == "btc") {
		process(lclient, hash);
	}

	function process(client, hash) {
		client.getTransaction(hash, function(err, data) {
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

							self.logic(self.complete);

						}
					}
				}

			}
		});
	}
	this.logic = function(callback) {


		//checking if transaction has 0 or 1 confirms while under 25 btc
		if (self.amount < 25) {
			//if it has 1 confirm, proccess it
			if (self.confirmations >= 1) {
				//tracker.remove(self.txid);
				tracker.add(self.txid, self.confirmations, self.amount, self.address);
				callback();
			} else {
				console.log('Received payment to ' + self.address);
				tracker.add(self.txid, self.confirmations, self.amount, self.address);
			}
		} else {
			//transactions at this point are above 25 btc

			//checking if transaction has a single confirm, if so, we queue it up for later proccessing
			if (self.confirmations == 1) {
				store(self.txid, self.currency);
			}
			//checking if the transaction has more than 6 confirms or if the transaction is less worth than the blocks needed to attack, if so, we proccess it
			else if (self.confirmations >= 6 || (self.confirmations > 1 && self.amount < self.confirmations * 25)) {
				tracker.add(self.txid, self.confirmations, self.amount, self.address);
				//checking if the transaction we are proccessing has already been queued, if so, we proccess the transact and delete it from queue
				if (stored) {
					unstore(self.txid, self.currency, function() {
						callback();
						tracker.add(self.txid, self.confirmations, self.amount, self.address);
						//tracker.remove(self.txid);
					});
				}
				//if not stored, we proccess but without deleting (because there is nothing to delete anyways)
				else {
					callback();
					tracker.add(self.txid, self.confirmations, self.amount, self.address);
					//tracker.remove(self.txid);
				}
			}
		}
	}

	this.complete = function() {
		console.log('Processing payment ' + self.amount + ' ' + self.currency + ' to ' + self.address);
		self.emit('payment', self);
		track.complete(self.hash,self.address,self.amount);
		database.txnbase.findID(self.address, function(err, secureid) {
			if (err) {
				console.log('Database adding error!: ' + err);
			} else if (!secureid) {
				console.log('Not found for address: ' + self.address);
			} else {
				database.txnbase.create(secureid, self.address, self.amount);
			}
		});
	}

}


util.inherits(transaction, events);


function unstore(hash, currency, callback) {
	var dir = "./unconfirmed/" + currency;

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

function store(hash, currency) {
	var dir = "./unconfirmed/" + currency;

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