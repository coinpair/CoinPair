//The pending module!

var events = require('events').EventEmitter,
    fs = require('fs'),
    async = require('async');

var lastChecked = 0;

function pending() {
    var self = this;

    this.pendArray = []; //The great pend array of CoinPair, BEHOLD IT!
    this.pendArrayFiled = []; //The pending saved arrays, for all transactions in hold

    this.add = function(hash) {
        self.pendArray.push(hash);
    }
    this.remove = function(hash) {
        var index = pendArray.indexOf(hash);
        if (index > 0) {
            self.pendArray.splice(index, 1);
        }
    }
    this.list = function(callback) {
        var current = new Date().getTime();
        var filedPending = [];
        //just making sure we minimize our usage of hdd
        if (current - lastChecked > 1000 * 5) {
            lastChecked = current;
            readDir('./unconfirmed/', function(array) {
                self.pendArrayFiled = array;
                var n = [];
                n.concat(self.pendArray, self.pendArrayFiled);
                callback(n);
            });


        } else {
            var n = [];
            n.concat(self.pendArray, self.pendArrayFiled);
            callback(n);
        }

    }

    this.debug = function() {
        readDir('./unconfirmed/', function(array) {
            console.log(array);
        });

    }
}

function readDir(dir, callbackFinal) {
    var gathered = [];
    fs.readdir(dir, function(err, file) {
        if (!err) {
            async.forEach(file, function(item, callback) {
                fs.readdir(dir + item + '/', function(err, file2) {
                    if (!err) {
                        async.forEach(file2, function(item2, callback2) {
                                var str = item2.substr(item2.length - 4);
                                if (str == '.txt') {
                                    gathered.push(item2.substr(0, item2.length - 4));
                                }

                                callback2();


                            },
                            function(err) {
                                callback();
                            });
                    } else {
                        callback();
                    }
                });

            }, function(err) {
                callbackFinal(gathered);
            });

        }
    });
}

module.exports = pending;