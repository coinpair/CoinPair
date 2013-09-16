//Exchange rates!
var BTCE = require('btce'),
	config = require('./../config.js');

var btce = new BTCE(config.btce.key, config.btce.secret);


function rate(from, to, callback) {
	usdPrice(from, function(err, firstRate) {
		if (err) {
			callback(err);
		} else {
			usdPrice(to, function(err, secondRate) {
				if (err) {
					callback(err);
				} else {
					callback(false, firstRate / secondRate);
				}
			});
		}
	});

}
var cooldownArray = [];
var proccessDestroy = false;

function fetch(from, to, callback) {
	for (var i = 0; i < cooldownArray.length; i++) {
		var element = cooldownArray[i];
		if (from == element.from && to == element.to) {
			callback(false, element.rate);
			console.log('archived!');
			return;
		}
	}
	usdPrice(from, function(err, firstRate) {
		if (err) {
			callback(err);
		} else {
			usdPrice(to, function(err, secondRate) {
				if (err) {
					callback(err);
				} else {
					callback(false, firstRate / secondRate);
					cooldownArray.push({
						from: from,
						to: to,
						rate: firstRate / secondRate
					});
					if(proccessDestroy == false){
						proccessDestroy = true;
						setTimeout(function(){
							cooldownArray = [];
							proccessDestroy = false;
						}, 1000 * config.ratePeriod)
					}
				}
			});
		}
	});
}

function usdPrice(currency, callback) {
	btce.ticker({
		pair: currency + '_' + 'usd'
	}, function(err, data) {

		if (err) callback(err)
		else callback(false, data.ticker.avg);
	})
}
module.exports = rate;