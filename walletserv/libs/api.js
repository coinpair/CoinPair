//The api module!
var app = require('express')(),
	events = require('events').EventEmitter,
	util = require('util'),
	config = require('./../config.js'),
	addy = require('bitcoin-address'),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	winston = require('winston');


io.set('log level', 1);

var allowedFrom = config.allow.from;
var allowedTo = config.allow.to;

function api(port) {
	var self = this;

	self.socketUpdate = function(room, data, events) {
		io.sockets. in (room).emit(events, data);
	};

	app.get('/:from-:to/:rec', function(req, res) {
		req.params.to = req.params.to.toLowerCase();
		req.params.from = req.params.from.toLowerCase();

		if (allowedFrom.indexOf(req.params.from) != -1) {

			if (allowedTo.indexOf(req.params.to) != -1) {

				if (isset(req.params.rec)) {
					if (req.params.rec.length >= 30) {
						self.emit('request', req.params.from, req.params.to, req.params.rec, res);
					} else {

						sendErr(res, 'invalid address')
					}
				} else {

					sendErr(res, 'missing receiving address');
				}
			} else {
				sendErr(res, 'unsupported to-currency');
			}

		} else {
			sendErr(res, 'unsupported from-currency');
		}
	});
	app.get('/track/:id', function(req, res) {
		var id = req.params.id;
		if (!isset(id) || (id.length != 20)) {
			sendErr(res, 'improper id');
		} else {
			self.emit('track', id, res);
		}
	});

	app.get('/dev/dontsharethisurlmkay/', function(req, res) {
		self.emit('dev', res);
	});

	app.get('/dev/force/:cur/:id', function(req, res) {
		self.emit('force', req.params.id, req.params.cur, res);
	});

	app.get('/rate/:pair/', function(req, res) {
		var pair = req.params.pair.toLowerCase();
		if (isset(pair) && pair.length == 7 && pair.indexOf('-') != -1) {
			var seperated = pair.split('-');
			if (config.allow.from.indexOf(seperated[0]) != -1 && config.allow.to.indexOf(seperated[1]) != -1) {
				self.emit('rate', seperated[0], seperated[1], res);
			} else {
				sendErr(res, 'not supported pair');
			}
		} else {
			sendErr(res, 'improper pair');
		}
	});
	app.get('/lookup/:id/', function(req, res) {
		var secureid = req.params.id;
		if (secureid.length != 20) {
			res.jsonp({
				error: "improper length"
			});
		} else {
			self.emit('lookup', secureid, res);
		}
	});

	io.sockets.on('connection', function(socket) {
		socket.on('subscribe', function(room) {
			winston.log('socket', 'joining room ' + room);
			socket.join(room);
		})

		socket.on('unsubscribe', function(room) {
			winston.log('socket', 'leaving room ' + room);
			socket.leave(room);
		})

		socket.on('send', function(data) {
			winston.log('socket', 'sending message');
			io.sockets. in (data.room).emit('message', data);
		});
	});

	app.on('error', function(err) {
		console.log(err);
	});

	server.listen(port);

}

util.inherits(api, events);

function sendErr(res, message) {
	res.send({
		error: message
	});
}

function isset() {
	// http://kevin.vanzonneveld.net
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: FremyCompany
	// +   improved by: Onno Marsman
	// +   improved by: Rafał Kukawski
	// *     example 1: isset( undefined, true);
	// *     returns 1: false
	// *     example 2: isset( 'Kevin van Zonneveld' );
	// *     returns 2: true

	var a = arguments,
		l = a.length,
		i = 0,
		undef;

	if (l === 0) {
		throw new Error('Empty isset');
	}

	while (i !== l) {
		if (a[i] === undef || a[i] === null) {
			return false;
		}
		i++;
	}
	return true;
}

function sendErr(res, message) {
	res.jsonp({
		error: message
	});
}

module.exports = api;