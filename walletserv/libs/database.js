//The database module!

var pg = require('pg'),
	config = require('./../config.js');


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
				console.log('Test error: ' + err);

			} else {
				client.query('select * from addresslist;', function(err, rows) {
					console.log(rows);
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

	this.txnbase.create = function(secureid, hash, amount, date, callback) {
		connect(function(err, done, client) {
			if (err) {
				callback('Create error: ' + err);
				done();
			} else {
				client.query("insert into txnbase (secureid, hash, amount, date) values ($1, $2, $3, $4);", [secureid, hash, amount, date], function(err, rows) {
					if (err) console.log('txn insertion error!: ' + err);
					callback(err, rows);
					done();
				});
			}
		});
	}


	this.txnbase.find = function(secureid, callback) {
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

		connect(function(err, done, client) {
			if (err) {
				callback('rate Create error: ' + err);
				done();
			} else {

				client.query("INSERT INTO ratebase (hash, rate, date) SELECT '" + hash + "', " + rate + ", now() WHERE NOT EXISTS (SELECT 1 FROM ratebase WHERE hash='" + hash + "');", function(err, res) {
					if (err) console.log('rate insertion error!: ' + err);
					callback(err, res);
					done();
				});

			}
		});
	}
	this.ratebase.remove = function(hash, callback) {

		connect(function(err, done, client) {
			if (err) {
				console.log('rate remove of ' + hash + ' error: ' + err);
				if (typeof callback != undefined) callback(err);
				done();
			} else {
				client.query("delete from ratebase where hash=$1;", [hash], function(err, rows) {
					if (err) console.log('rate deletion error!: ' + err);
					if (typeof callback != undefined) callback(err, rows);
					done();
				});
			}
		});
	}
	this.ratebase.rate = function(hash, callback) {
		console.log('Getting rate!');
		connect(function(err, done, client) {
			if (err) {
				callback('rate Create error: ' + err);
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
}

module.exports = database;