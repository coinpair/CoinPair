//The walletnotify module!

var net = require('net'),
	events = require('events').EventEmitter,
	util = require('util'),
	config = require('../config.js'),
	winston = require('winston');


function walletNotify(port) {

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
				winston.log('error', 'Error parsing: ' + str);
			} else {
				if (config.allow.from.indexOf(json.type) != -1) self.emit('notify', json.hash, json.type);
				else self.emit('error', 'Received wnotify for unallowed type');
			}
		});

	});

	this.server.listen(port);
}


util.inherits(walletNotify, events);

module.exports = walletNotify;