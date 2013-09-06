//The pending module!

var events = require('events').EventEmitter;

function pending(){
    var self = this;

    this.pendArray = []; //The great pend array of CoinPair, BEHOLD IT!
    this.add = function(hash){
        self.pendArray.push(hash);
    }
    this.remove = function(hash){
        var index = pendArray.indexOf(hash);
        if(index > 0){
            self.pendArray.splice(index, 1);
        }
    }
    this.list = function(){
        return self.pendArray;
    }
}   
module.exports = pending;
