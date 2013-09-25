//The walletnotify module!

var net = require('net'),
	transaction = require('./transaction.js'),
	events = require('events').EventEmitter,
	util = require('util'),
	fs = require('fs');

function blockNotify(port, pending, database) {

	var self = this;

	this.server = net.createServer(function(c) { //'connection' listener
		c.on('data', function(data) {
			var str = data.toString();
			var json;
			try {
				json = JSON.parse(str);
			} catch (e) {
				// invalid json input, set to null
				json = null
			}
			if (json == null) {
				console.log('Error parsing: ' + str);
			} else {
				var dir = './unconfirmed/' + json.type + '/';
				self.emit('received');

				process(dir, function(name, currency) {
					fs.readFile(dir + name, 'utf-8', function(err, text) {
						if (!err) {
							var txn = new transaction(pending, database, currencys, text, true);

							txn.on('payment', function(transact) {
								self.emit('payment', transact);
							});
							txn.on('fresh', function(transact){
								self.emit('fresh', transact);
							});
						}
					});
					s
				});
			}
		});

	});

	this.server.listen(port);
}

util.inherits(blockNotify, events);

function process(dir, callback) {
	fs.readdir(dir, function(err, file) {
		if (err) {
			//console.log('readdir err: ' + err);
		} else {
			var str = file.substr(file.length - 4);
			if (str == '.txt') {
				callback(file, curDir)
			}
		}
	});
}

module.exports = blockNotify;
