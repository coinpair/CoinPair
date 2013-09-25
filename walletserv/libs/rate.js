//Exchange rates!
var BTCE = require('btce'),
	config = require('./../config.js'),
	request = require('request');

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
		
		for (var i = 0; i < config.allow.from.length; i++) {
			var cur = config.allow.from[i];
			usdPrice(cur, function(err, rate, currency) {
				console.log(currency);
				if (err) {
					console.log('Pricing err! ' + err);
				} else {
					priceArray.push({
						type: currency,
						price: rate
					});
				}
			});
		}
	}
	this.refresh();
	setInterval(self.refresh, config.ratePeriod * 1000);

	this.timeLeft = function() {
		return (self.time - new Date()) / 1000;
	}
}


function fetch(from, to, callback) {
	var newFrom, newTo;
	for (var i = 0; i < priceArray.length; i++) {
		if (priceArray[i].type == from) newFrom = priceArray[i].price;
		if (priceArray[i].type == to) newTo = priceArray[i].price;
	}
	callback(false, newFrom / newTo);

}

function usdPrice(currency, callback) {
	var pair = currency + '_' + 'usd'
	jsonGet('http://btc-e.com/api/2/' + pair + '/ticker', function(err, json) {
		console.log(json);
		if (err) {
			callback(err);
		} else {
			console.log(json.ticker.avg + ' for ' + currency);
			callback(false, json.ticker.avg, currency);
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
module.exports = rate;