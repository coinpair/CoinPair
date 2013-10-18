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
	failure = require('./libs/failure.js'),
	testing = require('./libs/test.js'),
	txnManager = require('./libs/txnManager.js'),
	stored = require('./libs/stored.js');


//setting up our services
rate = new rate();
database = new database();
api = new api(config.ports.api);
walletnotify = new walletnotify(config.ports.wnotify);
blocknotify = new blocknotify(config.ports.bnotify);

txnManager = new txnManager(function(txn, callback) {
	//transaction logic
	if (txn.confirmations == 1) callback(false);
	else callback(true);
});


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

txnManager.on('payment', function(txn) {
	processTxn(txn);
	//console.log('[COMM] Notifying ' + txn.address + ' of completion');
	api.socketUpdate(txn.address, {
		txid: txn.txid,
		amount: txn.amount
	}, 'complete');
});

txnManager.on('queued', function(txn) {
	console.log('[COMM] Notifying ' + txn.address + ' of update (confirms: ' + txn.confirmations + ')');
	api.socketUpdate(txn.address, txn, 'update');
});
txnManager.on('new', function(txn) {
	console.log('[RATE] Setting rate for txn ' + txn.txid);
	setRate(txn);
});
txnManager.on('error', function(err) {
	console.log('txnman: ' + err);
});

walletnotify.on('notify', function(hash, type) {
	console.log('[NOTIFICATION] received notify from wallet clients');
	database.procbase.create(hash, type, function(err) {
		if (err) console.log('Couldnt add ' + txn.txid + ' to procbase');
	});
	txnManager.update(hash, type);
});

walletnotify.on('error', function(err) {
	console.log('Wallet notify: ' + err);
});

blocknotify.on('block', function(type) {
	console.log('[BLOCK]');
	txnManager.block(type);
});

blocknotify.on('error', function(err) {
	console.log('Block notify: ' + err);
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
			var pendingTxn = txnManager.find(result.input);


			rate.rate(result.fromcurrency, result.tocurrency, function(err, rateVal) {
				if (err) {
					console.log('rate err: ' + err);
					sendErr(res, 'internal error (server fault)');
				} else {
					database.txnbase.find(secureid, function(err2, results) {
						if (err2) {
							sendErr(res, 'internal error (server fault)');
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

function setRate(txn) {
	database.find(txn.address, function(err, result) {
		if (result) {
			rate.rate(txn.currency, result.tocurrency, function(err, conversionRate) {
				if (err) {
					console.log('rate error: ' + err);
					console.log('[CRITICAL] Couldnt rate lock ' + txn.txid);

				} else {
					database.ratebase.create(txn.txid, conversionRate, function(err) {
						if (err) {
							console.log("[CRITICAL] Couldnt rate lock " + txn.txid + ", got error: " + err);
						}

					});
				}
			});
		} else {
			console.log('[WARN] Not stored (pair not found in db)');
		}
	});
}

function processTxn(txn) {

	var address, currency, toCurrency;

	database.find(txn.address, function(err, result) {
		if (err) {
			console.log('Couldnt process ' + txn.txid + ' database err: ' + err);
			return;
		}
		toCurrency = result.tocurrency;
		address = result.receiver;
		rate.fee(toCurrency, function(err, fee) {
			if (err) {
				console.log('Couldnt process ' + txn.txid + ', rate err: ' + err);
				return;
			}
			var original = txn.amount;
			txn.amount = txn.amount - fee;
			if (txn.amount > 0) {
				processRow(txn, original, result);
			} else {
				console.log('Received small amount (below flat fee), txid: ' + txn.txid + ' amount: ' + original);
			}
		});
	});
}



function processRow(txn, original, row) {

	database.ratebase.rate(txn.txid, function(err, found) {
		if (err || !found) {
			var toCurrency = row.tocurrency,
				receiver = row.receiver;
			rate.rate(txn.currency, toCurrency, function(err, conversionRate) {
				if (err) {
					console.log('Exchange error: ' + err);
					console.log('Couldnt process ' + txn.txid);
					failure(txn.txid, 'couldnt reach a rate, err: ' + err);
				} else {
					var fee = config.fee;

					var sendAmount = txn.amount * conversionRate;

					console.log('sending ' + sendAmount + ' ' + toCurrency + ' to ' + receiver + ' after initial ' + original + ' ' + txn.currency);
					send(toCurrency, receiver, sendAmount, function(err) {
						if (err) console.log('send fail, err: ' + err);
						else {
							console.log('Muh databases!');
							database.txnbase.create(row.secureid, txn.txid, txn.amount, function() {
								if (err) console.log('txnbase create err: ' + err);
								console.log('Created record of txn');
								database.procbase.remove(txn.txid, function(err, res) {
									if (err && res.rowCount == 0) console.log('Couldnt delete ' + txn.txid + 'from procbase');
									
								});
							});
						}

					});
				}
			});
		} else {
			var fee = config.fee;

			var sendAmount = txn.amount * found.rate;
			console.log('sending ' + sendAmount + ' ' + txn.currency + ' to ' + row.receiver + ' after initial ' + original + ' ' + txn.currency);
			send(txn.currency, row.receiver, sendAmount, function(err) {
				if (err) failure(txn.txid, 'send fail, err: ' + err);
				else {
					database.txnbase.create(row.secureid, txn.txid, txn.amount, function() {
						if (err) console.log('txnbase create err: ' + err);
						console.log('Created record of txn');
						database.procbase.remove(txn.txid, function(err, res) {
							if (err && res.rowCount == 0) console.log('Couldnt delete ' + txn.txid + 'from procbase');
							
						});
					});
				}
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