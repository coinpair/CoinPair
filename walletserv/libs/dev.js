function dev(res, database) {
	var wallet = require('../libs/wallet.js'),
		config = require('./../config.js'),
		async = require('async');
		
	wallet = new wallet();
	database.devbase.list(function(err, rows) {
		if (err) res.send('Couldnt contact database');
		else {
			var array = rows.rows;
			var response = '<html>';
			response += '<head><title>dev page</title></head>';
			response += '<body>';
			response += '<h1>Listing Balances</h1><ul>';
			async.forEach(config.allow.from, function(item, callback) {
				wallet.find(item).getBalance('*', 1, function(err, balance) {
					if (err) response += '<li>Error for ' + item + ': ' + err + '</li>';
					else response += '<li>' + item + ': ' + balance + '</li>';
					callback();
				});
			}, function(err) {
				response += '</ul>';
				response += '<h1>Listing all processed transactions</h1>';
				response += '<ul>';
				for (var i = rows.rowCount - 1; i != -1; i--) {
					var element = array[i];
					response += '<li><b style="background-color: ' + color(element.hash) + '">' + element.hash + '</b> at ' + element.date + ' [' + element.conversion + '] - ' + element.type + '</li>';
				}
				response += '</ul>'
				response += '</body>';
				response += '</html>';
				res.send(response);
			});


		}
	});
}

function color(str) {

	// str to hash
	for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));

	// int/hash to hex
	for (var i = 0, colour = "#"; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));

	return colour;
}
module.exports = dev;