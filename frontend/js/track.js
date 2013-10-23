$(document).load(function() {


});
$(document).ajaxError(function() {
	hideSpinner();
	$('body').append('<div class="well"><h1>We could not find any addresses</h1>The id in the url may be mistyped, it may not exist, or your connection to the server is not complete.</div>');
});

var pageID;
$(document).ready(function() {
	spinner();
	var prmstr = window.location.search.substr(1);
	var prmarr = prmstr.split("&");
	var params = {};

	for (var i = 0; i < prmarr.length; i++) {
		var tmparr = prmarr[i].split("=");
		params[tmparr[0]] = tmparr[1];
	}
	if (isset(params['id']) && params['id'].length > 0) {
		pageID = params['id'];
		lookup(params['id'], function(err, data) {
			if (err) {
				hideSpinner();
				$('body').append('<div class="well"><h1>We could not find any addresses</h1>The id in the url may be mistyped, it may not exist, or your connection to the server is not complete.</div>');
			} else {
				hideSpinner();
				if (isset(data.failed)) {
					$('body').append('<div class="row"><div class="well"><h1>We could not find any addresses</h1>The id in the url may be mistyped, it may not exist. The server gave this reason: ' + data.failed + '</div></div>');
				} else {

					page(data);
				}
			}
		});
	}

});
var toReceive = 1;

$('.to-receive').keyup(function() {
	if (isNumber($(".to-receive").val())) {
		toReceive = Number($(".to-receive").val());
		if ($(".to-receive").val().length > 0) {
			var amount = parseFloat(Math.ceil(toReceive/exRate * 100000000)/100000000 + fee).toFixed(8);
			$('.rate-place').html(amount.replace(/0*$/, ''));
		}
	}
});

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

var receiveCurrency = false,
	currencyPair,
	exRate,
	fee;

function page(data) {
	var time = new Date().getTime() / 1000 + data.timeTo; //getting current time in seconds and adding timeto
	startClock(time);

	$('.address-place').append(data.address);
	$('.receive-place').append(data.receiver);
	$('.from-place').append(data.from.toUpperCase());
	exRate = data.rate;
	fee = data.fee;

	var amount = parseFloat(Math.ceil(toReceive/exRate * 100000000)/100000000 + fee).toFixed(8);
	$('.rate-place').html(amount.replace(/0*$/, ''));
	receiveCurrency = data.from;
	currencyPair = data.from + '-' + data.to;

	$('.to-place').append(data.to.toUpperCase());
	$('.qr-place').append('<img alt="qr code" src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + data.address + '"/>');
	$('.conversion-place').append(data.from.toUpperCase() + ' to ' + data.to.toUpperCase());
	$('.upopulated').show();

	for (var i = 0; i < data.pending.length; i++) {
		var element = data.pending[i];
		setPending(element.txid, element.amount, element.confirmations);
	}
	for (var i = 0; i < data.history.length; i++) {
		var element = data.history[i];
		addToTable(element.hash, element.amount, element.date);
	}

	var connection = subscribe(data.address);
	connection.on('update', function(data) {
		setPending(data.txid, data.amount, data.confirmations);
	});
	connection.on('complete', function(data) {
		removePending(data.txid);
		addToTable(data.txid, data.amount, new Date().toString('yyyy-MM-dd'));
	});
}

function addToTable(txid, amount, date){
	$('.history-place tbody:nth-child(1)').append('<tr><td>'+date+'</td><td>'+txid+'</td><td>'+amount+'</td></tr>');
}

function startClock(seconds) {
	clock(seconds, function(timeleft) {
		$('.time-place').html(Math.ceil(timeleft));
		$('.timebar-place').css('width', (timeleft / 60 * 100) + '%');
	}, function() {
		calculateRate(currencyPair, function(err, rate) {
			if (!err) {
				exRate = rate.rate; //wow, descriptive line
				fee = rate.fee;
				var amount = parseFloat(Math.ceil(toReceive/exRate * 100000000)/100000000 + fee).toFixed(8);
				$('.rate-place').html(amount.replace(/0*$/, ''));

				var time = new Date().getTime() / 1000 + rate.timeTo;
				startClock(time);
			}
		});
	});
}

function clock(seconds, effect, callback) {
	var diff = Math.ceil(seconds - (new Date().getTime() / 1000));
	if(diff > 0){
		effect(diff);
		setTimeout(function() {
			clock(seconds, effect, callback);
		}, 995);
	}
	else {
		callback();
	}
}

function calculateRate(pair, callback) {

	$.ajax({
		url: window.serverAddress + "/rate/" + pair + "/",
		dataType: "jsonp",
		async: false,
		type: 'get',
		success: function(data) {
			console.log(data);
			callback(false, data);
		},
		error: function() {
			callback(true);
		}
	});
}

function setPending(txid, amount, confirms) {
	$('.' + txid).remove();
	$('.pending-place').prepend('<li class="list-group-item ' + txid + '"><span class="badge">' + confirms + ' confirms</span><span class="label label-primary">' + amount + ' ' + receiveCurrency + '</span> ' + txid + '</li>');
}

function removePending(txid) {
	$('.' + txid).remove();
}

function subscribe(address) {
	var socket = io.connect(window.serverAddress);

	socket.emit('subscribe', address);

	return socket;

}

function spinner() {
	var opts = {
		lines: 10, // The number of lines to draw
		length: 15, // The length of each line
		width: 5, // The line thickness
		radius: 10, // The radius of the inner circle
		corners: 1, // Corner roundness (0..1)
		rotate: 0, // The rotation offset
		direction: 1, // 1: clockwise, -1: counterclockwise
		color: '#000', // #rgb or #rrggbb or array of colors
		speed: 1, // Rounds per second
		trail: 60, // Afterglow percentage
		shadow: false, // Whether to render a shadow
		hwaccel: false, // Whether to use hardware acceleration
		className: 'spinner', // The CSS class to assign to the spinner
		zIndex: 2e9, // The z-index (defaults to 2000000000)
		top: '100px', // Top position relative to parent in px
		left: 'auto' // Left position relative to parent in px
	};
	var target = document.getElementById('loadshow');
	var spinner = new Spinner(opts).spin(target);
	$('#loadshow').show();
}

function hideSpinner() {
	$('#loadshow').hide();
}

function lookup(id, callback) {
	$.ajax({
		url: window.serverAddress + "/lookup/" + id + "/",
		dataType: "jsonp",
		async: false,
		type: 'get',
		success: function(data) {
			console.log(data);
			callback(false, data);
		},
		error: function() {
			callback(true);
		}
	});
}

function isset() {
	// http://kevin.vanzonneveld.net
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: FremyCompany
	// +   improved by: Onno Marsman
	// +   improved by: Rafał Kukawski
	// *     example 1: isset( undefined, true);
	// *     returns 1: false
	// *     example 2: isset( 'Kevin van Zonneveld' );
	// *     returns 2: true

	var a = arguments,
		l = a.length,
		i = 0,
		undef;

	if (l === 0) {
		throw new Error('Empty isset');
	}

	while (i !== l) {
		if (a[i] === undef || a[i] === null) {
			return false;
		}
		i++;
	}
	return true;
}