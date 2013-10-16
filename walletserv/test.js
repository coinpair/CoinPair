var net = require('net'),
	request = request('request'),
	config = require('../walletserv/config.js');


describe('address creation', function() {

	it('wallet', function(done) {

	});

});
//client.write('{"type": "' + config.allow.from[0] + '", "hash": "garglegarglegargle"}');

function stream(ports, message, callback) {
	var client = net.connect({
			port: ports
		},
		function() { //'connect' listener
			client.write(message);
			callback();
		});
}