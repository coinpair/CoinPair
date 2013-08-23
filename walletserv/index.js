var walletnotify = require('./libs/walletnotify.js'),
	blocknotify = require('./libs/blocknotify.js');
var fs = require('fs');
var dir = './unconfirmed/btc/';

walletnotify = new walletnotify(1337); blocknotify = new blocknotify(1338);

walletnotify.on('payment', function(data) {
	console.log(data);
});