//Config!

var config = {}

config.database = {};

config.ports = {};

config.wallet = {};

config.directory = {};

//The ports used for services
config.ports.api = 5000;
config.ports.wnotify = 1337; //port to listen to for wallet notifications
config.ports.bnotify = 1338; //port to listen for block notifications

//wallet details
config.wallet.type = "testnet"; //prod for non-testnet

config.wallet.btc = {};
config.wallet.btc.username = 'bitcoinrpc';
config.wallet.btc.password = 'lolcake';
config.wallet.btc.port = 8332;
config.wallet.btc.host = 'localhost';


module.exports = config;