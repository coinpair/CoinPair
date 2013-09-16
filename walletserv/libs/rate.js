//Exchange rates!
var BTCE = require('btce'),
	config = require('./../config.js');

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



	this.refresh = function() {
		priceArray = [];
		for (var i = 0; i < config.allow.from.length; i++) {
			var cur = config.allow.from[i];
			usdPrice(cur, function(err, rate, currency) {
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
	btce.ticker({
		pair: currency + '_' + 'usd'
	}, function(err, data) {

		if (err) callback(err)
		else callback(false, data.ticker.avg, currency);
	})
}
module.exports = rate;