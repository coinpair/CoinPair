var expect = require('expect.js'),
	walletnotify = require('./libs/walletnotify.js'),
	blocknotify = require('./libs/blocknotify.js'),
	database = require('./libs/database.js'),
	transaction = require('./libs/transaction.js'),
	api = require('./libs/api.js'),
	fs = require('fs'),
	config = require('./config.js'),
	address = require('./libs/address.js'),
	send = require('./libs/send.js'),
	rate = require('./libs/rate.js'),
	pending = require('./libs/pending.js'),
	failure = require('./libs/failure.js'),
	testing = require('./libs/test.js');

database = new database();

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
/*
describe('Suite two', function() {
	it(function(done) {

	});
}); */