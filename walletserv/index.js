var walletnotify = require('./libs/walletnotify.js');

walletnotify = new walletnotify(1337);

walletnotify.on('payment', function(data){
	console.log(data);
});