//The fail module!

var fs = require('fs');


function failure(type, message) {
	var message = type + ': ' + message;
	fs.appendFile('error.txt', type + ': ' + message, function(err) {
		if(err){
			console.log('Couldnt write error: ' + message);
		}
	});
}

module.exports = failure;