//the txn storage module!

var fs = require('fs'),
	config = require('../config.js');

function stored() {
	this.refresh = function(currency, callback) {
		currency = currency.toLowerCase();
		var dir = config.confirmations.dir + currency + '/' + currency + '/';

		process(dir, function(err, name, currency) {
			if (err) callback(err);
			else {
				fs.readFile(dir + name, 'utf-8', function(err, hash) {
					if (err) callback(err);
					else {
						callback(false, hash);
					}
				});
			}
		});
	}

	this.unstore = function(hash, currency, callback) {
		currency = currency.toLowerCase();
		var dir = "./unconfirmed/" + currency;

		fs.unlink(dir + '/' + hash + ".txt", hash, function(err) {
			if (err) {
				callback(err);

			} else {

				callback(false);
			}
		});
	}

	this.store = function(hash, currency, callback) {
		var dir = "./unconfirmed/" + currency;

		mkdirp(dir, function(err) {
			if (err) callback(err);
			else {
				fs.writeFile(dir + '/' + hash + ".txt", hash, function(err) {
					if (err) {
						callback('store err: ' + err);
					} else {
						callback(false);
					}
				});
			}
		});
	}
}

function process(dir, callback) {
	fs.readdir(dir, function(err, file) {
		if (err) {
			callback(err);
		} else {
			var str = file.substr(file.length - 4);
			if (str == '.txt ') {
				callback(false, file);
			}
		}
	});
}

module.exports = stored;