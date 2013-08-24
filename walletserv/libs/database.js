//The database module!

var net = require('net'),
	pg = require('pg'),
	events = require('events').EventEmitter,
	util = require('util');

//Database structure and naming (in order of how a transaction should go)
//The "Sender" is the address of the user, he sends bitcoins to the next entity. This is set on first transaction.
//The "Input", this is the send-to address shown to user
//"Output", this is the address forwarding sender, this sends to whatever address the user specifies
//"Receiver", the intended goal from the player, this is the person the user wants to send to

//from database setup file: id serial, sender varchar(35), input varchar(35), output varchar(35), receiver varchar(35)

function database() {

	var self = this;
	var clnt = false;

	pg.connect(function(err, client, done) {
		var handleError = function(err) {
			if (!err) return false;
			done(client);
			next(err);
			return true;
		};
		clnt = client;
		self.emit('connection');

	});

	this.create = function(input, output, receiver, callback) {
		clnt.query("insert into addresslist (input, output, receiver) values ($1, $2, $3);", [input, output, receiver], function(err) {
			callback(err);
		});
	}
	this.backaddress = function(index, address, callback) {
		clnt.query("update addresslist set sender=$1 where id=$2;", [address, index], function(err) {
			callback(err);
		});
	}
	this.opposite = function(address, callback){
		clnt.query("select * from addresslist where input=$1 or output=$1;", [address], function(err, row){
			if(err){
				callback(err);
			}
			else {
				if(row.rows.length > 1){
					callback('duplicate rows on address ' + address);
				}
				else if (row.rows.length == 0){
					callback(false, false);
				}
				else{
					callback(false, row.rows[0]);
				}
				
			}
		})
	}
}
util.inherits(database, events);

module.exports = database;