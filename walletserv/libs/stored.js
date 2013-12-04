//the txn storage module!

var fs = require('fs'),
	mkdirp = require('mkdirp'),
	config = require('../config.js'),
	winston = require('winston');


function stored() {
	this.refresh = function(currency, callback) {
		currency = currency.toLowerCase();
		var dir = config.confirmations.dir + currency + '/';

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
		var dir = "./unconfirmed/" + currency + '/' + hash + ".txt";
		fs.exists(dir, function(exists) {

			if (exists) {
				fs.unlink(dir, function(err) {

					if (err) {
						callback(err);

					} else {

						callback(false);
					}
				});
			} else {
				callback(false);
			}
		});

	}

	this.store = function(hash, currency, callback) {
		winston.log('txn', 'Storing ' + hash + ' for currency ' + currency);
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
	fs.readdir(dir, function(err, files) {
		if (err) {
			callback(err);
		} else {
			for (var i = 0; i < files.length; i++) {

				var file = files[i];
				var str = file.substr(file.length - 4);

				if (str == '.txt') {

					callback(false, file);
				}
			}
		}
	});
}

module.exports = stored;