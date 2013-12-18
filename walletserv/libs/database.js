//The database module!

var pg = require('pg'),
	config = require('./../config.js'),
	winston = require('winston');


//Database structure and naming (in order of how a transaction should go)
//The "Sender" is the address of the user, he sends bitcoins to the next entity. This is set on first transaction.
//The "Input", this is the send-to address shown to user
//"Output", this is the address forwarding sender, this sends to whatever address the user specifies
//"Receiver", the intended goal from the player, this is the person the user wants to send to

//from database setup file: id serial, sender varchar(35), input varchar(35), receiver varchar(35), fromcurrency varchar(3), tocurrency varchar(3)

function database() {

	var self = this;

	function connect(callback) {
		pg.connect(config.database.string, function(err, client, done) {
			if (err) {
				done(client);
				callback(err);
			} else {
				callback(false, done, client);
			}


		});

	}
	this.test = function() {
		connect(function(err, done, client) {
			if (err) {
				winston.log('dev', 'Test error: ' + err);

			} else {
				client.query('select * from addresslist;', function(err, rows) {
					winston.log('error', rows);
				});
			}
		});
	}

	this.query = function(query, callback) {
		connect(function(err, done, client) {
			if (err) {
				callback(err);

			} else {
				client.query(query, function(err, rows) {
					callback(err, rows);
					done();
				});
			}
		});
	}

	this.create = function(input, receiver, from, to, secureid, callback) {
		winston.log('db', 'Creating address for ' + from + '-' + to + ' for ' + secureid);
		connect(function(err, done, client) {
			if (err) {
				callback('Create error: ' + err);

			} else {
				client.query("insert into addresslist (input, receiver, fromcurrency, tocurrency, secureid) values ($1, $2, $3, $4, $5);", [input, receiver, from, to, secureid], function(err, rows) {
					callback(err, rows);
					done();
				});
			}
		});
	}

	this.address = function(secureid, callback) {
		winston.log('db', 'Getting data for sid ' + secureid);
		connect(function(err, done, client) {
			if (err) {
				callback('Create error: ' + err);

			} else {
				var query = client.query("select * from addresslist where secureid=$1;", [secureid], function(err, result) {
					var show;
					if (result.rowCount == 0) {
						show = false;
					} else {
						show = result.rows[0];
					}
					callback(err, show);
					done();
				});

			}
		});
	}
	this.find = function(address, callback) {
		winston.log('db', 'Getting data for addy ' + address);
		connect(function(err, done, client) {
			if (err) {
				callback('Create error: ' + err);

			} else {
				var query = client.query("select * from addresslist where input=$1;", [address], function(err, result) {
					var show;
					if (result.rowCount == 0) {
						show = false;
					} else {
						show = result.rows[0];
					}
					callback(err, show);
					done();
				});

			}
		});
	}
	this.txnbase = {};

	this.txnbase.create = function(secureid, hash, amount, callback) {
		winston.log('db', 'Creating txn for ' + secureid);
		connect(function(err, done, client) {
			if (err) {
				callback('Create error: ' + err);
				done();
			} else {
				client.query("insert into txnbase (secureid, hash, amount, date) values ($1, $2, $3, now());", [secureid, hash, amount], function(err, rows) {
					callback(err, rows);
					done();
				});
			}
		});
	}


	this.txnbase.find = function(secureid, callback) {
		winston.log('db', 'Finding txn data for ' + secureid);
		connect(function(err, done, client) {
			if (err) {
				callback('Create error: ' + err);

			} else {
				var query = client.query("select * from txnbase where secureid=$1", [secureid], function(err) {
					if (err) {
						callback(err);
					}
				});
				var total = 0;
				var ret = [];
				query.on('row', function(row) {
					ret.push(row);
					total++;
				});
				query.on('end', function() {
					callback(false, ret, total);
					done();
				});
			}
		});
	}

	this.ratebase = {};

	this.ratebase.create = function(hash, rate, callback) {
		winston.log('db', 'Creating rate for ' + hash);
		connect(function(err, done, client) {
			if (err) {
				callback('connect error: ' + err);
				done();
			} else {

				client.query("INSERT INTO ratebase (hash, rate, date) SELECT '" + hash + "', " + rate + ", now() WHERE NOT EXISTS (SELECT 1 FROM ratebase WHERE hash='" + hash + "');", function(err, res) {
					callback(err, res);
					done();
				});

			}
		});
	}
	this.ratebase.remove = function(hash, callback) {
		winston.log('db', 'Removing rate for ' + hash);
		connect(function(err, done, client) {
			if (err) {
				callback(err);
				done();
			} else {
				client.query("delete from ratebase where hash=$1;", [hash], function(err, rows) {

					callback(err, rows);
					done();
				});
			}
		});
	}
	this.ratebase.rate = function(hash, callback) {
		winston.log('db', 'Getting rate for ' + hash);
		connect(function(err, done, client) {
			if (err) {
				callback('connect error: ' + err);
				done();
			} else {
				client.query("select * from ratebase where hash=$1;", [hash], function(err, rows) {
					if (err) {
						callback(err);
					} else if (rows.rowCount >= 1) {
						callback(false, rows.rows[0]);
					} else {
						callback(false, false);
					}
				});
			}
		});
	}

	this.procbase = {}
	this.procbase.create = function(hash, address, amount, originalCurrency, currency, callback) {
		winston.log('db', 'Creating pending entry for ' + hash);
		connect(function(err, done, client) {
			if (err) {
				callback('connect error: ' + err);
				done();
			} else {
				//CREATE TABLE IF NOT EXISTS procbase (hash varchar(65), address varchar(34), amount float, original varchar(3), currency varchar(3), date date
				client.query("INSERT INTO procbase (hash, address, amount, original, currency, date) VALUES ($1, $2, $3, $4, $5, now());", [hash, address, amount, originalCurrency, currency], function(err, res) {

					callback(err, res);
					done();
				});

			}
		});
	}
	this.procbase.exists = function(hash, callback) {
		winston.log('db', 'Finding if hash exists: ' + hash);
		connect(function(err, done, client) {
			if (err) {
				callback('connect error: ' + err);
				done();
			} else {
				//CREATE TABLE IF NOT EXISTS procbase (hash varchar(65), address varchar(34), amount float, original varchar(3), currency varchar(3), date date
				client.query("SELECT * FROM procbase WHERE hash=$1;", [hash], function(err, res) {
					if (res.rowCount != 1) res = false;
					else res = res.rows[0];

					callback(err, res);
					done();
				});

			}
		});
	}
	this.procbase.list = function(currency, callback) {
		winston.log('db', 'Finding all in pending marked ' + currency);
		connect(function(err, done, client) {
			if (err) {
				callback('connect error: ' + err);
				done();
			} else {

				client.query("SELECT * FROM procbase WHERE original=$1;", [currency], function(err, res) {
					if (res.rowCount == 0) res = false;
					else res = res.rows;
					callback(err, res);
					done();
				});

			}
		});
	}
	this.procbase.remove = function(hash, callback) {
		winston.log('db', 'Removing pending entry for ' + hash);
		connect(function(err, done, client) {
			if (err) {
				callback('connect error: ' + err);
				done();
			} else {

				client.query("DELETE FROM procbase WHERE hash=$1;", [hash], function(err, res) {
					callback(err, res);
					done();
				});

			}
		});
	}

	this.devbase = {}
	this.devbase.create = function(hash, conversion, type, callback) {
		winston.log('db', 'Creating devbase entry for ' + hash);
		connect(function(err, done, client) {
			if (err) {
				callback('devbase connect error: ' + err);
				done();
			} else {

				client.query("INSERT INTO devbase (hash, conversion, type, date) VALUES ($1, $2, $3, now());", [hash, conversion, type], function(err, res) {
					callback(err, res);
					done();
				});

			}
		});
	}
	this.devbase.list = function(callback) {
		winston.log('db', 'Listing devbase');
		connect(function(err, done, client) {
			if (err) {
				callback('connect error: ' + err);
				done();
			} else {

				client.query("select * from devbase;", function(err, res) {
					callback(err, res);
					done();
				});

			}
		});
	}
	this.stats = {};
	this.stats.create = function(type, metadata, data, callback) {
		winston.log('db', 'Creating statistic entry');
		connect(function(err, done, client) {
			if (err) {
				callback('connect error: ' + err);
				done();
			} else {

				client.query("insert into statistics (type, metadata, data, date) values ($1, $2, $3, now());", [type, metadata, data], function(err, res) {
					callback(err, res);
					done();
				});

			}
		});
	}
	this.stats.list = function(type, callback) {
		winston.log('db', 'Creating statistic entry');
		connect(function(err, done, client) {
			if (err) {
				callback('connect error: ' + err);
				done();
			} else {

				client.query("select * from statistics where type=$1;", [type], function(err, res) {
					if (!err && res.rowCount > 0) res = res.rows;
					else res = false;
					callback(err, res);
					done();
				});

			}
		});
	}
}

module.exports = database;