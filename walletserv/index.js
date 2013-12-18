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
	async = require('async'),
	winston = require('winston'),
	stats = require('./libs/stats.js');


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
blocknotify = new blocknotify(config.ports.bnotify),
stats = new stats();
check();

txnManager = new txnManager(function(txn, callback) {
	//transaction logic
	if (txn.confirmations > 1) callback(true, false);
	else callback(false, false);
});

var longest = 0;

console.log(stats.list());

setInterval(function() {
	var statsArray = stats.list();
	statsArray = statsArray.slice(0);
	stats.dump();
	async.forEach(statsArray, function(element, callback) {
		//this.stats.create = function(type, metadata, data, timestamp, callback) {
		var value = Math.floor(element.total / element.count * 1000) / 1000;
		database.stats.create(element.type, element.metadata, value.toString(), function(err, res) {
			if (err || res.rowCount == 0) {
				winston.log('error', 'couldnt create statistic');
				winston.log('error', err);
			}
			callback();
		});
	});

}, 1000 * 60 * 60 * config.period);


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

txnManager.on('new', function(txn) {
	winston.log('txn', 'processing notified receive for hash ' + txn.txid + ' (' + txn.currency + ')');
	create(txn);
});

txnManager.on('payment', function(txn) {
	winston.log('txn', 'Receive to ' + txn.address + ' completed');
	complete(txn);
	api.socketUpdate(txn.address, {
		txid: txn.txid,
		amount: txn.amount
	}, 'complete');
});

txnManager.on('update', function(txn) {
	winston.log('txn', 'Notifying ' + txn.address + ' of update (confirms: ' + txn.confirmations + ')');
	api.socketUpdate(txn.address, txn, 'update');
});

function complete(txn) {
	var start = new Date().getTime();
	winston.log('txn', 'Completing order for hash ' + txn.txid + ' (' + txn.currency + ')');
	database.procbase.exists(txn.txid, function(err, exists) {
		if (err) {
			winston.log('errorc', 'Could not process transaction, db err: ' + err);
		} else {
			if (exists) {
				if (exists.amount > 0) {
					send(exists.currency, exists.address, exists.amount, function(err) {
						if (err) {
							winston.log('errorc', 'send fail, err: ' + err);

						} else {
							var end = new Date().getTime();
							stats.average('txn', 'create', end - start);
							stats.add('volume', exists.original + '-' + exists.currency, exists.amount);
							remove(txn);
							winston.log('txn', 'Completed ' + exists.amount + ' ' + exists.currency + ' to ' + exists.address);
						}

					});
				} else {
					remove(txn);
					winston.log('txn', 'Dropped ' + exists.hash + ' for amount below 0');
				}
			} else {
				winston.log('Order doesnt exist for ' + txn.txid + ' (' + txn.currency + ')');
			}
		}
	});
}

function create(txn) {
	winston.log('txn', 'Creating order for hash ' + txn.txid + ' (' + txn.currency + ')');
	var start = new Date().getTime();
	database.procbase.exists(txn.txid, function(err, exists) {;
		if (err || exists) {
			if (err) {
				winston.log('errorc', 'Couldnt create new order. err: ' + err);
				failTxn(txn);
			} else {
				winston.log('txn', 'Dropping new order, exists');
			}
			return;
		}
		database.find(txn.address, function(err, result) {
			if (result) {
				rate.rate(txn.currency, result.tocurrency, function(err, conversionRate) {
					if (err) {
						winston.log('errorc', 'rate error: ' + err);
						failTxn(txn);

					} else {
						rate.fee(result.fromcurrency, function(err, fee) {
							if (err) {
								winston.log('errorc', 'conversion fee err: ', err);
								sendErr(res, 'Couldnt get exchange rate fee (server error)');
								failTxn(txn);
							} else {
								var amount = Math.ceil((txn.amount * conversionRate - fee) * 100000000) / 100000000;
								database.procbase.create(txn.txid, result.receiver, amount, txn.currency, result.tocurrency, function(err, res) {
									if (err || res.rowCount == 0) {
										winston.log('errorc', 'Couldnt create procbase entry. err: ' + err);
										failTxn(txn);
									} else {
										var end = new Date().getTime();
										stats.average('txn', 'create', end - start);
										winston.log('txn', 'Created order to ' + result.receiver + ' for ' + amount + ' ' + result.tocurrency + ' from ' + txn.amount + ' ' + txn.currency);
									}
								});
							}
						});
					}
				});
			} else {
				winston.log('txn', '[WARN] Not stored (pair not found in db)');
			}
		});
	})
}

function check() {
	database.procbase.list('btc', function(err, rows) {
		if (err) {
			winston.log('error', 'DB find error: ' + err);
		} else if (rows) {
			async.forEach(rows, function(item, callback) {
				txnManager.update(item.hash, item.original);
			});
		}
	});
}

function remove(txn) {
	var start = new Date().getTime();
	winston.log('txn', 'Removing order for hash ' + txn.txid + ' (' + txn.currency + ')');
	database.procbase.remove(txn.txid, function(err, row) {
		if (err || row.rowCount == 0) {
			if (err) winston.log('errorc', 'Procbase err: ' + err);
			else winston.log('errorc', 'Procbase remove err: Did not delete anything (not present in db?)');
			failTxn(txn);
		} else {
			var end = new Date().getTime();
			stats.average('txn', 'remove', end - start);
		}
	});
}

function failTxn(txn) {
	winston.log('errorc', 'Failure for hash ' + txn.txid + ' (' + txn.currency + ')');
}

txnManager.on('error', function(err) {
	winston.log('error', 'txnman: ' + err);
});

walletnotify.on('notify', function(hash, type) {
	winston.log('info', 'received notify from wallet clients');
	txnManager.update(hash, type, true);
});

walletnotify.on('error', function(err) {
	winston.log('error', 'Wallet notify: ' + err);
});

blocknotify.on('block', function(type) {
	winston.log('info', 'Received block notify of ' + type);
	check();
});

blocknotify.on('error', function(err) {
	winston.log('error', 'Block notify: ' + err);
});

api.on('dev', function(res) {
	dev(res, database);
});

//Dealing with api requests for a bitcoin address
api.on('lookup', function(secureid, res) {
	var start = new Date().getTime();
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
									var end = new Date().getTime();
									stats.average('request', 'lookup', end - start);
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
	var start = new Date().getTime();
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
					var end = new Date().getTime();
					stats.average('request', from + '-' + to, end - start);
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
	var start = new Date().getTime();
	database.txnbase.find(id, function(err, rows, count) {
		if (err) {
			sendErr(res, 'internal error (server fault)');
			winston.log('error', 'txnbase find id err: ' + err);
		} else {
			var end = new Date().getTime();
			stats.average('request', 'track', end - start);
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
		var start = new Date().getTime();
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
						var end = new Date().getTime();
						stats.average('request', 'rate', end - start);
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



function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function sendErr(res, message) {
	res.jsonp({
		error: message
	})
}