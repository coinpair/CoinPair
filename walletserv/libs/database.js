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

	this.create = function(input, receiver, from, to, secureid, callback) {
		connect(function(err, done, client) {
			if (err) {
				callback('Create error: ' + err);

			} else {
				client.query("insert into addresslist (input, receiver, fromcurrency, tocurrency, secureid) values ($1, $2, $3, $4, $5);", [input, receiver, from, to, secureid], function(err) {
					callback(err);
					done();
				});
			}
		});
	}

	this.backaddress = function(index, address, callback) {
		connect(function(err, done, client) {
			if (err) {
				callback(err);

			} else {
				client.query("update addresslist set sender=$1 where id=$2;", [address, index], function(err) {
					callback(err);
					done();
				});
			}
		});
	}
	this.row = function(address, callback) {
		connect(function(err, done, client) {
			if (err) {
				callback(err);

			} else {
				client.query("select * from addresslist where input=$1;", [address], function(err, row) {
					if (err) {
						callback(err);
					} else {
						if (row.rows.length > 1) {
							callback('duplicate rows on address ' + address);
						} else if (row.rows.length == 0) {
							callback(false, false);
						} else {
							callback(false, row.rows[0]);
						}

					}
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
				var query = client.query("select * from addresslist where secureid=$1;", [secureid], function(err, result){
					var show;
					if(result.rowCount == 0){
						show = false;
					}
					else {
						show = result.rows[0];
					}
					callback(err, show);
					done();
				});

			}
		});
	}

	this.txnbase = {};

	this.txnbase.create = function(secureid, hash, amount, date) {
		connect(function(err, done, client) {
			if (err) {
				callback('Create error: ' + err);
				done();
			} else {
				client.query("insert into txnbase (secureid, hash, amount, date) values ($1, $2, $3, $4);", [secureid, hash, amount, date], function(err) {
					if(err)console.log('txn insertion error!: ' + err);
					done();
				});
			}
		});
	}
	this.txnbase.findID = function(address, callback) {
		connect(function(err, done, client) {
			if (err) {
				callback('Create error: ' + err);

			} else {
				var query = client.query("select * from addresslist where input=$1;", [address], function(err, result){
					var show;
					if(result.rowCount == 0){
						show = false;
					}
					else {
						show = result.rows[0].secureid;
					}
					callback(err, show);
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
}

module.exports = database;