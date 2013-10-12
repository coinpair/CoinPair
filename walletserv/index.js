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
	failure = require('./libs/failure.js'),
	testing = require('./libs/test.js'),
	stored = require('./libs/stored.js');


//setting up our services
rate = new rate();
pending = new pending();
database = new database();
api = new api(config.ports.api, pending);
walletnotify = new walletnotify(config.ports.wnotify);
blocknotify = new blocknotify(config.ports.bnotify);

setTimeout(function() {
	if (config.test) {
		processTxn(testing.faketxn());
		if (config.loadTest) {
			loadtest();
		}
	}
}, 2000);

var longest = 0;



function loadtest() {
	var from = 'btc',
		to = 'btc',
		rec = 'mq7se9wy2egettFxPbmn99cK8v5AFq55Lx',
		start = new Date().getTime();

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
					time = new Date().getTime() - start;
					if (time > longest) {
						longest = time;
					}
					console.log('Created! Execution time: ' + time + 'ms longest: ' + longest + ' ms');
					loadtest();
				}
			});
		}
	});
}

walletnotify.on('notify', function(type, hash) {
	var txn = new transaction(pending, database, hash, type);
	txn.on('payment', function(transact) {
		processTxn(txn);
	});

	txn.on('fresh', function(transact, callback) {
		setRate(txn, callback);
	});
});

walletnotify.on('error', function(err) {
	console.log('Wallet notify: ' + err);
});

blocknotify.on('block', function() {
	stored(function(err, hash, currency) {
		var txn = new transaction(pending, database, currency, hash, true);
		txn.on('payment', function(transact) {
			processTxn(txn);
		});

		txn.on('fresh', function(transact, callback) {
			setRate(txn, callback);
		});
	});
});

blocknotify.on('error', function(err) {
	console.log('Block notify: ' + err);
});

pending.on('status', function(txn) {

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
								rate.fee(result.fromcurrency, function(err, fee) {

									if (err) {
										console.log('conversion fee err: ', err);
										sendErr(res, 'Couldnt get exchange rate fee (server error)');
									} else {
										res.jsonp({
											address: result.input,
											receiver: result.receiver,
											from: result.fromcurrency,
											to: result.tocurrency,
											rate: rateVal,
											fee: fee,
											time: rate.time,
											timeTo: rate.timeLeft(),
											pending: pendingTxn,
											history: results
										});
									}
								});
							}
						});
					}
				});

			});
		}
	});
});

//dealing with address request
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

//dealing with track requests
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

//dealing with rate requests
api.on('rate', function(from, to, res) {
	console.log('Rate lookup!');
	if (from == to) {
		rate.fee(from, function(err, fee) {
			if (err) {
				console.log('Get fee err: ' + err);
				sendErr(res, 'Couldnt get fee (internal server error)');
			}
			res.jsonp({
				rate: 1,
				time: rate.time,
				timeTo: rate.timeLeft(),
				fee: fee
			});
		});
	} else {


		rate.rate(from, to, function(err, rateVal) {
			if (err) {
				sendErr(res, 'internal error (server fault)');
				console.log('fetch rate err: ' + err);
			} else {
				rate.fee(from, function(err, fee) {

					if (err) {
						console.log('conversion fee err: ', err);
						sendErr(res, 'Couldnt get exchange rate fee (server error)');
					} else {

						res.jsonp({
							rate: rateVal,
							time: rate.time,
							timeTo: rate.timeLeft(),
							fee: fee
						});
					}
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

function setRate(txn, callback) {
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
}

function processTxn(txn) {

	var address, currency, fromCurrency;

	address = txn.toAddress;
	currency = txn.to;
	fromCurrency = txn.from;


	rate.fee(fromCurrency, function(err, conversionRate) {
		var original = txn.amount;
		txn.amount = txn.amount - conversionRate * config.fee;
		if (txn.amount > 0) {
			processRow(txn, original);
		} else {
			console.log('Received small amount (below flat fee), txid: ' + txn.txid + ' amount: ' + original);
		}
	});
}



function processRow(txn, original) {
	database.ratebase.rate(txn.txid, function(err, found) {
		if (err || !found) {

			rate.rate(txn.from, txn.to, function(err, conversionRate) {
				if (err) {
					console.log('Exchange error: ' + err);
					console.log('Couldnt process ' + txn.txid);
					failure(txn.txid, 'couldnt reach a rate, err: ' + err);
				} else {
					var fee = config.fee;

					var sendAmount = txn.amount * conversionRate;

					console.log('sending ' + sendAmount + ' ' + txn.to + ' to ' + txn.toAddress + ' after initial ' + original + ' ' + txn.from);
					send(txn.to, txn.toAddress, sendAmount, function(err) {
						failure(txn.txid, 'send fail, err: ' + err);

					});
				}
			});
		} else {
			var fee = config.fee;


			var sendAmount = txn.amount * found.rate;
			console.log('sending ' + sendAmount + ' ' + txn.to + ' to ' + txn.toAddress + ' after initial ' + txn.amount + ' ' + txn.from);
			send(txn.to, txn.toAddress, sendAmount, function(err) {
				failure(txn.txid, 'send fail, err: ' + err);
			});
			database.ratebase.remove(txn.txid);
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