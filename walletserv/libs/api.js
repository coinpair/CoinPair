//The api module!
var app = require('express')(),
	events = require('events').EventEmitter,
	util = require('util'),
	config = require('./../config.js'),
	addy = require('bitcoin-address'),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);;

var allowedFrom = config.allow.from;
var allowedTo = config.allow.to;

function api(port, pending) {
	var self = this;

	self.socketUpdate = function(room, data){
		io.sockets. in (room).emit('update', data);
	};

	app.get('/:from-:to/:rec', function(req, res) {
		if (allowedFrom.indexOf(req.params.from) != -1) {

			if (allowedTo.indexOf(req.params.to) != -1) {
				if (isset(req.params.rec)) {
					if (addy.validate(req.params.rec, config.wallet.type)) {
						self.emit('request', req.params.from, req.params.to, req.params.rec, res);
					} else {
						res.send(400, 'INVALID ADDRESS');
					}
				} else {
					res.send(400, 'MISSING RECEIVING ADDRESS')
				}
			} else {
				res.send(404, 'NOT FOUND');
			}

		} else {
			res.send(404, 'NOT FOUND');
		}
	});

	io.sockets.on('connection', function(socket) {
		socket.on('subscribe', function(room) {
			console.log('joining room', room);
			socket.join(room);

			io.sockets. in (room + 'facs').emit('update', 'jel');
		})

		socket.on('unsubscribe', function(room) {
			console.log('leaving room', room);
			socket.leave(room);
		})

		socket.on('send', function(data) {
			console.log('sending message');
			io.sockets. in (data.room).emit('message', data);
		});
	});

	app.get('/debug/', function(req, res) {
		res.send('Debuginn!');

	});

	app.get('/list/:address', function(req, res) {
		if (isset(req.params.address)) {
			pending.findAddy(req.params.address, function(result) {
				if (result) {
					res.jsonp({
						status: 'found',
						txn: result
					});
				} else {
					res.jsonp({
						status: 'notfound'
					})
				}
			});
		} else {
			res.send(404, 'NOT FOUND');
		}
	});

	app.on('error', function(err) {
		console.log(err);
	});

	server.listen(port);

}

util.inherits(api, events);

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

module.exports = api;