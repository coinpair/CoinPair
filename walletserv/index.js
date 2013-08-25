var walletnotify = require('./libs/walletnotify.js'),
	blocknotify = require('./libs/blocknotify.js'),
	database = require('./libs/database.js'),
	api = require('./libs/api.js'),
	fs = require('fs'),
	config = require('./config.js'),
	address = require('./libs/address.js');

database = new database();


api = new api(config.ports.api);


api.on('request', function(from, to, rec, res) {
	generateAddresses(from, to, function(err, inputAddy, outputAddy) {
		if (err) {
			res.send(500, 'INTERNAL ERROR');
		} else {
			createRow(inputAddy, outputAddy, rec, function(err) {
				if (err) {
					res.send(500, 'INTERNAL ERROR');
				} else {
					res.json({
						address: inputAddy,
						sendfrom: outputAddy
					});
				}
			});
		}
	});

});


function createRow(input, output, receiver, callback) {
	database.create(input, output, receiver, function(err) {
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
			address(to, function(err, output) {
				if (err) {
					console.log('generate address #1 err: ' + err);
					callback(true);
				} else {
					callback(false, input, output);
				}
			});
		}
	});
}

walletnotify = new walletnotify(config.ports.wnotify);
blocknotify = new blocknotify(config.ports.bnotify);

walletnotify.on('payment', function(data) {
	console.log(data);
});