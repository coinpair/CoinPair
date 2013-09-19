//The walletnotify module!

var net = require('net'),
	events = require('events').EventEmitter,
	util = require('util'),
	transaction = require('./transaction.js');


function walletNotify(port, pending, database) {

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
				self.emit('received', json.type);

				var txn = new transaction(pending, database, json.type, json.hash);
				txn.on('payment', function(transact) {
					self.emit('payment', transact);
				});

			}
		});

	});

	this.server.listen(port);
}


util.inherits(walletNotify, events);

module.exports = walletNotify;
