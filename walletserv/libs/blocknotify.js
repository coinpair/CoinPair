//The walletnotify module!

var net = require('net'),
	events = require('events').EventEmitter,
	util = require('util'),
	config = require('../config.js');


function blockNotify(port) {

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
				self.emit('error', 'Error parsing: ' + str);
			} else {
				if (config.allow.from.indexOf(json.type) != -1) self.emit('block', json.type, json.hash);
				else self.emit('error', 'Received bnotify for unallowed type');
			}
		});

	});

	this.server.listen(port);
}

util.inherits(blockNotify, events);

function process(dir, callback) {
	fs.readdir(dir, function(err, file) {
		if (err) {
			console.log('readdir err: ' + err);
		} else {
			var str = file.substr(file.length - 4);
			if (str == '.txt ') {
				callback(file, curDir)
			}
		}
	});
}

module.exports = blockNotify;