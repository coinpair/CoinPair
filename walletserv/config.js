//Config!

var config = {}

config.database = {};

config.ports = {};

config.wallet = {};

config.directory = {};

//The ports used for services
config.ports.api = 5111;
config.ports.wnotify = 1337; //port to listen to for wallet notifications
config.ports.bnotify = 1338; //port to listen for block notifications

//What to allow
config.allow = {};
config.allow.from = ['btc', 'ltc'];
config.allow.to = ['btc', 'ltc'];

//wallet details
config.wallet.type = "testnet"; //prod for non-testnet

config.wallet.btc = {};
config.wallet.btc.username = 'bitcoinrpc';
config.wallet.btc.password = 'lolcake';
config.wallet.btc.port = 18332;
config.wallet.btc.host = 'localhost';

config.wallet.ltc = {};
config.wallet.ltc.username = 'bitcoinrpc';
config.wallet.ltc.password = 'lolcake';
config.wallet.ltc.port = 19332;
config.wallet.ltc.host = 'localhost';

//btce details
config.btce = {}
config.btce.key = '4PIMC2Z5-CVNDK5FS-IH2Q02OG-UTN70CJ9-PNZZP7JC';
config.btce.secret = '623bbcfe86dc284c91f7733efb6e72f772ea904186d018a1ac8443da33f87a2f';

//database!
config.database = {};
config.database.string = "postgres://postgres:dev@localhost/postgres";

//fee!
config.fee = 0.01;
module.exports = config;
