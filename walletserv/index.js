var walletnotify = require('./libs/walletnotify.js'),
	blocknotify = require('./libs/blocknotify.js'),
	database = require('./libs/database.js'),
	api = require('./libs/api.js'),
	fs = require('fs'),
	config = require('./config.js'),
	address = require('./libs/address.js'),
	send = require('./libs/send.js'),
	rate = require('./libs/rate.js'),
	testing = require('./libs/test.js'),
	txnManager = require('./libs/txnManager.js'),
	stored = require('./libs/stored.js'),
	dev = require('./libs/dev.js'),
	winston = require('winston');

winston = new(winston.Logger)({
	levels: config.logLevels.levels,
	colors: config.logLevels.colors,
	transports: [new winston.transports.Console({
			colorize: 'true'
		}),
		new(winston.transports.File)({
			filename: config.logfile
		})
	]
});

//setting up our services
rate = new rate();
database = new database();
api = new api(config.ports.api);
walletnotify = new walletnotify(config.ports.wnotify);
blocknotify = new blocknotify(config.ports.bnotify);

txnManager = new txnManager(function(txn, callback) {
	//transaction logic
	if (txn.confirmations == 1) callback(false, false);
	else if (txn.confirmations >= config.confirmations.cull) callback(true, true);
	else callback(true, false);
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
			winston.log('error', 'Generate address err: ' + err);

		} else {
			var id = makeid(20);
			createRow(inputAddy, rec, from, to, id, function(err) {
				if (err) {
					sendErr(res, 'internal error (server fault)');
					winston.log('error', 'Create entry in db err: ' + err);
				} else {
					time = new Date().getTime() - start;
					if (time > longest) {
						longest = time;
					}
					winston.log('dev', 'Created! Execution time: ' + time + 'ms longest: ' + longest + ' ms');
					loadtest();
				}
			});
		}
	});
}

txnManager.on('payment', function(txn) {
	complete(txn);
	winston.log('txn', 'Notifying ' + txn.address + ' of completion');
	api.socketUpdate(txn.address, {
		txid: txn.txid,
		amount: txn.amount
	}, 'complete');
});

txnManager.on('queued', function(txn) {
	winston.log('txn', 'Notifying ' + txn.address + ' of update (confirms: ' + txn.confirmations + ')');
	api.socketUpdate(txn.address, txn, 'update');
});
txnManager.on('new', function(txn) {
	database.devbase.create(txn.txid, 'initial', 'receive', function() {
		winston.log('txn', 'devbase logged txn');
	});
	winston.log('txn', 'Setting rate for txn ' + txn.txid);
	setRate(txn);
});
txnManager.on('error', function(err) {
	winston.log('error', 'txnman: ' + err);
});

walletnotify.on('notify', function(hash, type) {
	winston.log('txn', 'received notify from wallet clients');
	database.procbase.create(hash, type, function(err) {
		if (err) winston.log('error', 'Couldnt add ' + hash + ' to procbase');
	});
	txnManager.update(hash, type);
});

walletnotify.on('error', function(err) {
	winston.log('error', 'Wallet notify: ' + err);
});

blocknotify.on('block', function(type) {
	txnManager.block(type);
});

blocknotify.on('error', function(err) {
	winston.log('error', 'Block notify: ' + err);
});

api.on('dev', function(res) {
	dev(res, database);
});

//Dealing with api requests for a bitcoin address
api.on('lookup', function(secureid, res) {
	database.address(secureid, function(err, result) {
		if (err) {
			sendErr(res, 'internal error (server fault)');
			winston.log('error', 'DB lookup err: ' + err);
		} else if (!result) {
			sendErr(res, 'no results for specified secureid')
		} else {
			var pendingTxn = txnManager.find(result.input);


			rate.rate(result.fromcurrency, result.tocurrency, function(err, rateVal) {
				if (err) {
					winston.log('error', 'rate err: ' + err);
					sendErr(res, 'internal error (server fault)');
				} else {
					database.txnbase.find(secureid, function(err2, results) {
						if (err2) {
							sendErr(res, 'internal error (server fault)');
							winston.log('error', 'txn find err: ' + err2);
						} else {
							rate.fee(result.fromcurrency, function(err, fee) {

								if (err) {
									winston.log('error', 'conversion fee err: ', err);
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
			winston.log('error', 'Generate address err: ' + err);
		} else {
			var id = makeid(20);
			createRow(inputAddy, rec, from, to, id, function(err) {
				if (err) {
					sendErr(res, 'internal error (server fault)');
					winston.log('error', 'Create entry in db err: ' + err);
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
			winston.log('error', 'txnbase find id err: ' + err);
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
				winston.log('error', 'Get fee err: ' + err);
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
				winston.log('error', 'fetch rate err: ' + err);
			} else {
				rate.fee(from, function(err, fee) {

					if (err) {
						winston.log('error', 'conversion fee err: ', err);
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

api.on('force', function(hash, type, res) {
	txnManager.update(hash, type);
	res.send('ok');
});

function complete(txn) {
	database.find(txn.address, function(err, pair) {
		if (err || !pair) {
			winston.log('errorc', '[CRITICAL] Couldnt process ' + txn.txid + ' database err: ' + err);
			return;
		}
		database.ratebase.rate(txn.txid, function(err, txnRate) {
			if (err || !txnRate) {
				winston.log('errorc', 'Couldnt find rate for ' + txn.address);
				return;
			}
			rate.fee(pair.tocurrency, function(err, fee) {
				if (err) {
					winston.log('errorc', 'Couldnt get fee for ' + txn.address);
					return;
				}
				var sendAmount = Math.ceil((txn.amount * txnRate.rate - fee) * 100000000) / 100000000;
				if (sendAmount > 0) {
					send(pair.tocurrency, pair.receiver, sendAmount, function(err) {
						if (err) {
							winston.log('errorc', 'send fail, err: ' + err);
							return;
						}
						cull(txn, pair, sendAmount, false);

					});
				} else {
					winston.log('txn', 'Received amount below fee');
					cull(txn, pair, 0, true);
				}


			});
		});
	});
}

function cull(txn, row, amount, dropped) {
	if (!row) {
		row = {
			tocurrency: 'unset'
		}
	}
	if (!dropped) {
		database.txnbase.create(row.secureid, txn.txid, txn.amount, function(err) {
			if (err) winston.log('error', 'txnbase create err: ' + err);
		});
		database.devbase.create(txn.txid, txn.amount + ' ' + txn.currency + ' to ' + amount + ' ' + row.tocurrency, 'send', function(err) {
			if (err) winston.log('error', 'devbase create err: ' + err);
		});
	} else {
		database.devbase.create(txn.txid, txn.amount + ' ' + txn.currency + ' to ' + amount + ' ' + row.tocurrency, 'drop', function(err) {
			if (err) winston.log('error', 'devbase create err: ' + err);
		});
	}

	database.procbase.remove(txn.txid, function(err, res) {
		if (err || res.rowCount == 0) winston.log('error', 'Couldnt delete ' + txn.txid + 'from procbase');
	});

	database.ratebase.remove(txn.txid, function(err) {
		if (err) winston.log('error', 'Couldnt remove from ratebase');
	});

}

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
			winston.log('error', 'database add err: ' + err);
			callback(true);
		} else {
			callback(false);
		}
	});
}

function generateAddresses(from, to, callback) {
	address(from, function(err, input) {
		if (err) {
			winston.log('error', 'generate address #1 err: ' + err);
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
					winston.log('error', 'rate error: ' + err);
					winston.log('errorc', 'Couldnt rate lock ' + txn.txid);

				} else {
					database.ratebase.create(txn.txid, conversionRate, function(err) {
						if (err) {
							winston.log('errorc', "Couldnt rate lock " + txn.txid + ", got error: " + err);
						}

					});
				}
			});
		} else {
			cull(txn, false, txn.amount, true);
			winston.log('error', '[WARN] Not stored (pair not found in db)');
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