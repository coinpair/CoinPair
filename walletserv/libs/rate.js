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
					callback(false, firstRate/secondRate);
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