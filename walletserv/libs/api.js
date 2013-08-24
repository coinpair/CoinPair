//The api module!
var express = require('express');

var app = express();

function api(port) {
	app.get('/***-***/', function(req, res) {
		console.log('Connect!');
	});

	app.listen(port);
}

module.exports = api;