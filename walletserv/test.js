var expect = require('expect.js'),
	async = require('async'),
	walletnotify = require('./libs/walletnotify.js'),
	blocknotify = require('./libs/blocknotify.js'),
	database = require('./libs/database.js'),
	api = require('./libs/api.js'),
	net = require('net'),
	config = require('./config.js'),
	address = require('./libs/address.js'),
	send = require('./libs/send.js'),
	rate = require('./libs/rate.js'),
	pending = require('./libs/pending.js'),
	request = require('request');

pending = new pending();
database = new database();
api = new api(config.ports.api, pending);
blocknotify = new blocknotify(config.ports.bnotify);
walletnotify = new walletnotify(config.ports.wnotify);

describe('config', function() {
	it('testing enabled', function(done) {
		expect(config.test).to.be.ok();
		done();
	});
});

describe('Database', function() {

	//create test
	it('Addressbase Create', function(done) {
		//this.create = function(input, receiver, from, to, secureid, callback) {
		database.create('testaddy', 'test', 'btc', 'btc', 'testid', function(err, rows) {
			expect(err).not.to.exist;

			expect(rows.rowCount).to.be.greaterThan(0);

			done();

		});
	});

	it('Addressbase Find via secureid', function(done) {
		database.address("testid", function(err, row) {
			expect(err).not.to.exist;

			expect(row).to.exist;

			done();
		});

	});

	it('Addressbase Find via address', function(done) {
		database.find("testaddy", function(err, row) {
			expect(err).not.to.exist;
			expect(row).to.exist;

			done();
		});

	});
	it('Addressbase Deletion', function(done) {
		database.query("delete from addresslist where secureid='testid';", function(err, rows) {
			expect(err).not.to.exist;
			expect(rows.rowCount).to.be.greaterThan(0);
			done();
		});

	});


	it('Txnbase Create', function(done) {
		//this.txnbase.create = function(secureid, hash, amount, date) {
		database.txnbase.create('testid', 'testhash', 1.2, 'today', function(err, rows) {
			expect(err).not.to.exist;
			expect(rows.rowCount).to.be.greaterThan(0);
			done();

		});
	});

	it('Txnbase Find', function(done) {
		database.txnbase.find('testid', function(err, array, count) {
			expect(err).not.to.exist;
			expect(array.length).to.be.greaterThan(0);
			expect(count).to.be.greaterThan(0);
			done();
		});

	});

	it('Txnbase Deletion', function(done) {
		database.query("delete from txnbase where secureid='testid';", function(err, rows) {
			expect(err).not.to.exist;
			expect(rows.rowCount).to.be.greaterThan(0);
			done();
		});

	});

	it('Ratebase Create', function(done) {
		//this.create = function(input, receiver, from, to, secureid, callback) {
		database.ratebase.create('testhash', 1, function(err, rows) {
			expect(err).not.to.exist;

			expect(rows.rowCount).to.be.greaterThan(0);

			done();

		});
	});

	it('Ratebase Deletion', function(done) {
		database.ratebase.remove('testhash', function(err, rows) {
			expect(err).not.to.exist;
			expect(rows.rowCount).to.be.greaterThan(0);
			done();
		});

	});

	it('Ratebase Deletion Confirm', function(done) {
		database.query("delete from ratebase where hash='testhash';", function(err, rows) {
			expect(err).not.to.exist;
			expect(rows.rowCount).to.be(0);
			done();
		});

	});

});

describe('wallet', function() {
	it('Send', function(done) {
		async.forEach(config.allow.from, function(item, next) {
			send(item, 'mq7se9wy2egettFxPbmn99cK8v5AFq55Lx', Math.pow(21, 9), function(err, success) {
				expect(err.toString()).to.equal('Error: Invalid amount');
				next();
			}, true);
		}, function() {
			done();
		});
		//testing by sending an overly large amount, should error out

	});
});

describe('address', function() {
	it('generate', function(done) {
		async.forEach(config.allow.from, function(item, next) {
			address(item, function(err, genAddress) {
				expect(err).not.to.exist;
				expect(genAddress.length).to.be.greaterThan(10);

				next();
			});
		}, function() {
			done();
		});

	});
});

describe('api', function() {
	it('rate', function(done) {
		request('http://127.0.0.1:' + config.ports.api + '/rate/' + config.allow.from[0] + '-' + config.allow.from[0] + '/', function(error, response, body) {
			expect(response.statusCode).to.be(200);
			expect(error).not.to.exist;

			//self.emit('rate', seperated[0], seperated[1], res);

		});
		api.on('rate', function(from, to, res) {
			res.send('OK');
			expect(from).to.exist;
			expect(to).to.exist;
			expect(res).to.exist;
			done();
		});
	});

	it('create', function(done) {
		request('http://127.0.0.1:' + config.ports.api + '/' + config.allow.from[0] + '-' + config.allow.from[0] + '/mq7se9wy2egettFxPbmn99cK8v5AFq55Lx/', function(error, response, body) {
			expect(response.statusCode).to.be(200);
			expect(error).not.to.exist;

		});
		//self.emit('request', req.params.from, req.params.to, req.params.rec, res);
		api.on('request', function(from, to, address, res) {
			res.send('OK');
			expect(from).to.exist;
			expect(to).to.exist;
			expect(address).to.exist;
			expect(res).to.exist;
			done();
		});
	});

	it('lookup', function(done) {
		request('http://127.0.0.1:' + config.ports.api + '/lookup/01234567890123456789/', function(error, response, body) {
			expect(response.statusCode).to.be(200);
			expect(error).not.to.exist;

		});
		//self.emit('lookup', secureid, res);
		api.on('lookup', function(secureid, res) {
			res.send('OK');
			expect(secureid).to.exist;
			expect(res).to.exist;
			done();
		});
	});
	it('track', function(done) {
		request('http://127.0.0.1:' + config.ports.api + '/track/01234567890123456789/', function(error, response, body) {
			expect(response.statusCode).to.be(200);
			expect(error).not.to.exist;

		});
		//self.emit('track', id, res);
		api.on('track', function(secureid, res) {
			res.send('OK');
			expect(secureid).to.exist;
			expect(res).to.exist;
			done();
		});
	});
});

describe('notify', function() {
	it('block', function(done) {

		var client = net.connect({
				port: config.ports.bnotify
			},
			function() { //'connect' listener
				client.write('{"type": "' + config.allow.from[0] + '", "hash": "garglegarglegargle"}');
				blocknotify.on('block', function() {
					done();
				})
			});
	});
	it('wallet', function(done) {

		var client = net.connect({
				port: config.ports.wnotify
			},
			function() { //'connect' listener
				client.write('{"type": "' + config.allow.from[0] + '", "hash": "garglegarglegargle"}');
				walletnotify.on('notify', function() {
					done();
				})
			});
	});

});