var pg = require('pg'),
	config = require('./config.js');

pg = new pg.Client(config.database.string);

pg.connect(function(err, client, done) {
	if (err) {
		console.log('setup err: ' + err);
	} else {
		connected = true;
		client.query('CREATE TABLE IF NOT EXISTS addresslist (id serial, sender varchar(35), input varchar(35), receiver varchar(35), fromcurrency varchar(3), tocurrency varchar(3), secureid varchar(20));', function(err, response) {
			if (err) {
				console.log('ubase create err: ' + err);
			} else {
				console.log('Addresslist created!');
				client.query('CREATE TABLE IF NOT EXISTS txnbase (id serial, secureid varchar(20), hash varchar(65), amount decimal, date varchar(65));', function(err, response) {
					if (err) {
						console.log('ubase create err: ' + err);
					} else {
						console.log('txnbase created!');
						client.query('CREATE TABLE IF NOT EXISTS ratebase (hash varchar(65), rate decimal, date date);', function(err, response) {
							if (err) {
								console.log('ubase create err: ' + err);
							} else {
								console.log('ratebase created!');
								client.query('CREATE TABLE IF NOT EXISTS procbase (hash varchar(65), address varchar(34), amount float, original varchar(3), currency varchar(3), date date);', function(err, response) {
									if (err) {
										console.log('ubase create err: ' + err);
									} else {
										console.log('procbase created');
										client.query('CREATE TABLE IF NOT EXISTS devbase (hash varchar(65), conversion varchar(30), type varchar(10), date date);', function(err, response) {
											if (err) {
												console.log('ubase create err: ' + err);
											} else {
												console.log('devbase created');
												client.query('CREATE TABLE IF NOT EXISTS statistics (type varchar(7), metadata varchar(10), data varchar(10), date timestamp);', function(err, response) {
													if (err) {
														console.log('ubase create err: ' + err);
													} else {
														console.log('statistics db created');
														process.exit(code = 0);
													}
												});
											}
										});

									}
								});

							}
							//done();
						});
					}
					//done();
				});
			}
			//done();
		});
	}
});