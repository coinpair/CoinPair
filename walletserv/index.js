var walletnotify = require('./libs/walletnotify.js'),
	blocknotify = require('./libs/blocknotify.js'),
	database = require('./libs/database.js'),
	api = require('./libs/api.js'),
	fs = require('fs');

database = new database();

/*
database.on('connection', function(err){
	database.opposite('fuckesd', function(err){
		console.log(err);
	});
});
*/

api = new api(5000);
walletnotify = new walletnotify(1337); 
blocknotify = new blocknotify(1338);

walletnotify.on('payment', function(data) {
	console.log(data);
});