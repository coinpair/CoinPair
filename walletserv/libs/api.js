//The api module!
var express = require('express'),
	events = require('events').EventEmitter,
	util = require('util'),
	config = require('./../config.js'),
	addy = require('bitcoin-address');

var app = express();

var allowedFrom = ['btc'];
var allowedTo = ['btc'];

function api(port) {
	var self = this;

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

	app.listen(port);
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