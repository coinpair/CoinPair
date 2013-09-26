//The fail module!

var fs = require('fs');


function failure(type, message) {
	var message = type + ': ' + message + '\n';
	fs.appendFile('error.txt', message, function(err) {
		if(err){
			console.log('Couldnt write error: ' + message);
		}
	});
}

module.exports = failure;
