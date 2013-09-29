var walletnotify = require('./libs/walletnotify.js'),
	blocknotify = require('./libs/blocknotify.js'),
	database = require('./libs/database.js'),
	transaction = require('./libs/transaction.js'),
	api = require('./libs/api.js'),
	fs = require('fs'),
	config = require('./config.js'),
	address = require('./libs/address.js'),
	send = require('./libs/send.js'),
	rate = require('./libs/rate.js'),
	pending = require('./libs/pending.js'),
	failure = require('./libs/failure.js');


//setting up our services
rate = new rate();
pending = new pending();
database = new database();
api = new api(config.ports.api, pending);
walletnotify = new walletnotify(config.ports.wnotify, pending, database);
blocknotify = new blocknotify(config.ports.bnotify, pending, database);

walletnotify.on('received', function(type) {
	console.log('Received call for ' + type);
});

blocknotify.on('received', function() {
	console.log('Block');
});

pending.on('status', function(txn) {
	console.log('Updating txn status!');
	api.socketUpdate(txn.address, txn, 'update');
});
pending.on('completion', function(hash, address, amount) {
	api.socketUpdate(address, {
		hash: hash,
		amount: amount
	}, 'complete');
});

//Dealing with api requests for a bitcoin address
api.on('lookup', function(secureid, res) {
	database.address(secureid, function(err, result) {
		if (err) {
			sendErr(res, 'internal error (server fault)');
			console.log('DB lookup err: ' + err);
		} else if (!address) {
			sendErr(res, 'couldnt fine address')
		} else {

			pending.findAddy(result.input, function(pendingTxn) {
				rate.rate(result.fromcurrency, result.tocurrency, function(err, rateVal) {
					if (err) {
						sendErr(res, 'internal error (server fault)');
					} else {
						database.txnbase.find(secureid, function(err2, results) {
							if (err || err2) {
								sendErr(res, 'internal error (server fault)');
								console.log('rate err: ' + err);
								console.log('txn find err: ' + err2);
							} else {
								res.jsonp({
									address: result.input,
									receiver: result.receiver,
									from: result.fromcurrency,
									to: result.tocurrency,
									rate: rateVal,
									time: rate.time,
									timeTo: rate.timeLeft(),
									pending: pendingTxn,
									history: results
								});
							}
						});
					}
				});

			});
		}
	});
});
api.on('request', function(from, to, rec, res) {
	generateAddresses(from, to, function(err, inputAddy) {
		if (err) {
			sendErr(res, 'internal error (server fault)');
			console.log('Generate address err: ' + err);
		} else {
			var id = makeid(20);
			createRow(inputAddy, rec, from, to, id, function(err) {
				if (err) {
					sendErr(res, 'internal error (server fault)');
					console.log('Create entry in db err: ' + err);
				} else {
					res.jsonp({
						address: inputAddy,
						secureid: id
					});
				}
			});
		}
	});

});

api.on('track', function(id, res) {
	database.txnbase.find(id, function(err, rows, count) {
		if (err) {
			sendErr(res, 'internal error (server fault)');
			console.log('txnbase find id err: ' + err);
		} else {
			if (count <= 0) {
				res.jsonp({
					total: count
				});
			} else {
				res.jsonp({
					total: count,
					results: rows
				});
			}
		}
	});
});

api.on('rate', function(from, to, res) {
	if (from == to) {
		res.jsonp({
			rate: 1,
			time: rate.time,
			timeTo: rate.timeLeft()
		});
	} else {


		rate.rate(from, to, function(err, rateVal) {
			if (err) {
				sendErr(res, 'internal error (server fault)');
				console.log('fetch rate err: ' + err);
			} else {
				res.jsonp({
					rate: rateVal,
					time: rate.time,
					timeTo: rate.timeLeft()
				});
			}
		});
	}
});

function makeid(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function createRow(input, receiver, from, to, secureid, callback) {
	database.create(input, receiver, from, to, secureid, function(err) {
		if (err) {
			console.log('database add err: ' + err);
			callback(true);
		} else {
			callback(false);
		}
	});
}

function generateAddresses(from, to, callback) {
	address(from, function(err, input) {
		if (err) {
			console.log('generate address #1 err: ' + err);
			callback(true);
		} else {
			callback(false, input);

		}
	});
}

//handling the events for when a transaction becomes confirmed and needs to be processed
walletnotify.on('fresh', function(txn, callback) {
	rate.rate(txn.from, txn.to, function(err, conversionRate) {
		if (err) {
			console.log('rate error: ' + err);
			console.log('Couldnt rate lock ' + txn.txid);
			callback();
		} else {
			database.ratebase.create(txn.txid, conversionRate, function(err) {
				if (err) {
					console.log("Couldnt rate lock " + txn.txid + ", got error: " + err);
				}
				callback();
			});
		}
	});
});

walletnotify.on('payment', function(txn) {
	received(txn);
});
blocknotify.on('payment', function(txn) {
	received(txn);
});

function received(txn) {
	database.row(txn.address, function(err, row) {
		if (err) {
			console.log('COULDNT PROCESS ' + txn.txid);
			console.log('DB ERROR: ' + err);
			failure(txn.txid, 'couldnt reach db or some shit, err: ' + err);
		} else {
			var address, currency, otherCurrency;
			if (row == false) {
				console.log('unconnected receive ' + txn.txid);
				return false;
			} else if (row.input == txn.address) {
				address = row.receiver;
				currency = row.tocurrency;
				otherCurrency = row.fromcurrency;
			} else if (row.output == txn.address) {
				address = row.sender;
				currency = row.fromcurrency;
				otherCurrency = row.tocurrency;
			}
			database.ratebase.rate(txn.txid, function(err, found) {
				if (err || !found) {
					
					rate.rate(otherCurrency, currency, function(err, conversionRate) {
						if (err) {
							console.log('Exchange error: ' + err);
							console.log('Couldnt process ' + txn.txid);
							failure(txn.txid, 'couldnt reach a rate, err: ' + err);
						} else {
							var fee;
							if (config.fee > 1) {
								fee = 1;
								console.log('Watch out the fee takes 100% of transaction!');
							} else if (config.fee > .25) {
								fee = config.fee;
								console.log('Fee takes more than 25% of transaction!');
							} else {
								fee = config.fee;
							}
							var sendAmount = txn.amount * conversionRate * (1 - fee);

							console.log('sending ' + sendAmount + ' ' + currency + ' to ' + address + ' after initial ' + txn.amount + ' ' + otherCurrency);
							send(currency, address, sendAmount, function(err) {
								failure(txn.txid, 'send fail, err: ' + err);

							});
						}
					});
				} else {
					console.log('preset pricin!');
					var fee;
					if (config.fee > 1) {
						fee = 1;
						console.log('Watch out the fee takes 100% of transaction!');
					} else if (config.fee > .25) {
						fee = config.fee;
						console.log('Fee takes more than 25% of transaction!');
					} else {
						fee = config.fee;
					}

					var sendAmount = txn.amount * found.rate * (1 - fee);
					console.log('sending ' + sendAmount + ' ' + currency + ' to ' + address + ' after initial ' + txn.amount + ' ' + otherCurrency);
					send(currency, address, sendAmount, function(err) {
						failure(txn.txid, 'send fail, err: ' + err);
					});
					database.ratebase.remove(txn.txid);
				}
			});
		}
	});
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function sendErr(res, message) {
	res.jsonp({
		error: message
	})
}