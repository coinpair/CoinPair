//Exchange rates!
var BTCE = require('btce'),
	config = require('./../config.js'),
	request = require('request'),
	async = require('async');

var btce = new BTCE(config.btce.key, config.btce.secret);

var priceArray = [];
var proccessDestroy = false;

function rate() {
	this.rate = function(from, to, callback) {
		fetch(from, to, function(err, rate) {
			callback(err, rate);
		});
	}

	var self = this;
	this.time;


	this.refresh = function() {
		self.time = new Date().getTime() + config.ratePeriod * 1000;

		var newArray = [];

		async.forEach(config.allow.from, function(item, callback) {
			var cur = item;
			usdPrice(cur, function(err, rate, currency) {
				if (err || !isset(rate)) {
					console.log('Pricing err! ' + err);
				} else {
					newArray.push({
						type: currency,
						price: rate
					});
				}
				callback();
			});
		}, function(err) {
			priceArray = newArray;
		});
		
	}
	this.refresh();
	setInterval(self.refresh, config.ratePeriod * 1000);

	this.timeLeft = function() {
		return (self.time - new Date()) / 1000;
	}
}


function fetch(from, to, callback) {
	from = from.toLowerCase();
	to = to.toLowerCase();
	var newFrom = false,
		newTo = false;
	console.log(priceArray);
	for (var i = 0; i < priceArray.length; i++) {
		if (priceArray[i].type == from) {
			newFrom = priceArray[i].price;
			console.log('Setting price for ' + from)
		}
		if (priceArray[i].type == to) {
			newTo = priceArray[i].price;
			console.log('Setting price for ' + to);
		}
	}

	callback(false, newFrom / newTo);

}

function usdPrice(currency, callback) {
	var pair = currency + '_' + 'usd'
	jsonGet('http://btc-e.com/api/2/' + pair + '/ticker', function(err, json) {
		if (err) {
			callback(err);
		} else {
			if (isset(json.ticker.avg)) {
				console.log(json.ticker.avg + ' for ' + currency);
				callback(false, json.ticker.avg, currency);
			} else {
				callback(json);
			}

		}
	});
}

function jsonGet(url, callback) {

	request(url, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			var foo;

			try {
				foo = JSON.parse(body);
			} catch (e) {
				// An error has occured, handle it, by e.g. logging it
				callback(e);
				return;
			}
			callback(false, foo);
		} else {
			callback(error);
		}
	});
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
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
module.exports = rate;