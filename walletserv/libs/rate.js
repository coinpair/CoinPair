//Exchange rates!
var BTCE = require('btce');
config = require('./../config.js');

var btce = new BTCE(config.btce.key, config.btce.secret);

function rate(pair, callback) {

	btce.ticker({
		pair: pair
	}, function(err, data) {
		if (err) callback(err)
		else callback(false, data.ticker.avg);
	})

}
module.exports = rate;