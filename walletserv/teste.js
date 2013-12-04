var winston = require('winston');
var myCustomLevels = {
	levels: {
		info: 0,
		debug: 1,
		foo: 2,
		bar: 3,
		baz: 4,
		foobar: 5
	},
	colors: {
		foo: 'blue',
		bar: 'green',
		baz: 'yellow',
		foobar: 'red'
	}
};

var customLevelLogger = new(winston.Logger)({
	level: 'foo',
	levels: myCustomLevels.levels,
	transports: [new winston.transports.Console()]
});
customLevelLogger.foobar('some foobar level-ed message');