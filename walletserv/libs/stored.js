//the txn storage module!

var fs = require('fs'),
	config = require('../config.js');

function stored(callback) {
	var dir = config.confirmations.dir + json.type + '/';

	process(dir, function(err, name, currency) {
		if (err) callback(err);
		else {
			fs.readFile(dir + name, 'utf-8', function(err, hash) {
				if (err) callback(err);
				else {
					callback(false, hash, currency);
				}
			});
		}
	});
}

function process(dir, callback) {
	fs.readdir(dir, function(err, file) {
		if (err) {
			callback(err);
		} else {
			var str = file.substr(file.length - 4);
			if (str == '.txt ') {
				callback(false, file, curDir)
			}
		}
	});
}

module.exports = stored;