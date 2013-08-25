//The walletnotify module!

var net = require('net'),
	transaction = require('./transaction.js'),
	fs = require('fs');

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
				console.log('Error parsing: ' + str);
			} else {
				var dir = './unconfirmed/btc/';

				fs.readdir(dir, function(err, files) {
					if (err) {
						console.log('readdir err: ' + err);
					} else {

						files.forEach(function(file) {
							var str = file.substr(file.length - 4);
							if (str == '.txt') {
								fs.readFile(dir + file, 'utf-8', function(err, text) {
									if (!err) {
										var txn = new transaction('btc', text, true);

										txn.on('new', function(){
											console.log('Proccessed!');
										});
										console.log(text);
									}
								});
							}
						});
					}
				});
			}
		});

	});

	this.server.listen(port);
}



module.exports = blockNotify;