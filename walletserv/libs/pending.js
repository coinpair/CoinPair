//The pending module!

var events = require('events').EventEmitter,
    fs = require('fs'),
    async = require('async');

var lastChecked = 0;

function pending() {
    var self = this;

    this.pendArray = []; //The great pend array of CoinPair, BEHOLD IT!
    this.pendArrayFiled = []; //The pending saved arrays, for all transactions in hold

    this.add = function(hash, conf, address, check) {

        if (typeof check === 'undefined') {
            check = true;
            console.log('Adding hash ' + hash + ' with ' + conf + ' to tracker');
        }

        var formatted = {
            hash: hash,
            address: address,
            confirmations: conf,
            index: self.pendArray.length
        }
        if (check) {
            self.find(hash, function(result) {
                if (result == false) {
                    self.pendArray.push(formatted);
                    //self.debug();
                } else {
                    self.replace(hash, hash, conf);
                }
            });
        }
        else {
            self.pendArray.push(formatted);
            //self.debug();
        }
    }

    this.alert = function(changed){
        self.emit('status', changed);
    }

    this.remove = function(hash) {
        self.find(hash, function(result){
            if(result){
                self.removeIndex(self.pendArray.indexOf(result));
            }
        });
    }

    this.removeIndex = function(index) {
        self.pendArray.splice(index, 1);
    }

    this.replace = function(original, hash, confirms) {
        self.find(original, function(item) {
            self.removeIndex(item.index);
            self.add(hash, confirms, false);
        });
    }

    this.find = function(hash, callback) {
        async.forEach(self.pendArray, function(item, next) {
            if (item.hash == hash) {
                callback(item);
            } else {
                next();
            }
        }, function(err) {
            callback(false);
        });
    }

    this.findAddy = function(address, callback) {
        async.forEach(self.pendArray, function(item, next) {
            if (item.address == address) {
                callback(item);
            } else {
                next();
            }
        }, function(err) {
            callback(false);
        });
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
        console.log(self.pendArray);

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

util.inherits(pending, events);

module.exports = pending;