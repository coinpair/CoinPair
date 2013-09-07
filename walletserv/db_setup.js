var pg = require('pg'),
	config = require('./config.js');

pg = new pg.Client(config.database.string);

pg.connect(function(err, client, done) {
	if (err) {
		console.log('setup err: ' + err);
	} else {
		connected = true;
		client.query('CREATE TABLE IF NOT EXISTS addresslist (id serial, sender varchar(35), input varchar(35), output varchar(35), receiver varchar(35), fromcurrency varchar(3), tocurrency varchar(3), secureid varchar(20));', function(err, response) {
			if (err) {
				console.log('ubase create err: ' + err);
			} else {
				console.log('Database created!');
			}
		    //done();
		});
	}
});
