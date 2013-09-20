$(".dropdown-menu li a").click(function() {
	var selText = $(this).text();
	$(this).parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
});
var from = false,
	to = false,
	toReceive = 0,
	rAddress = false;

$(".toReceive").change(function() {
	if (isNumber($(".toReceive").val())) {
		toReceive = Number($(".toReceive").val());
		if ($(".toReceive").val().length < 1) {
			toReceive = 0;
		}
		if (from && to) {
			clicked();
		}
	}
});
console.log(window.serverAddress);
function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}
$(".receiveAddress").change(function() {
	rAddress = $(".receiveAddress").val();
});

$(".fromcur li a").click(function() {
	from = $(this).text();
	clicked();
});

$(".tocur li a").click(function() {
	to = $(this).text();
	clicked();
});

$(".place-order").click(function() {
	if(from.length > 0 & to.length > 0 & rAddress.length > 0){
		place();
	}
	else {
		if(!rAddress || rAddress.length == 0){
			alert('Please specify a receiving address!' + rAddress.length);
		}
		else if (!from || !to){
			alert('Please set your from and to currencies!');
		}
	}
});

function clicked() {
	if (from && to) {

		update(from, to, toReceive);

	}
}

function update(from, to, amount) {
	var element = ".priceIndicator";

	$(element).html('...');
	calculateRate(from + '-' + to, function(err, rate) {
		if (err) {
			$(element).html('Could not contact server!');
		} else {
			if (amount == 0) {
				amount = 1;
			}
			var firstAmount = amount / rate;
			if (decimalPlaces(firstAmount) > 5) {
				firstAmount = parseFloat((firstAmount).toFixed(5));
			}
			$(element).html(firstAmount + ' ' + from + ' = ' + amount + ' ' + to);

		}
	});

}

function place() {
	if(from && to){
		spinner();
		request(from, to, rAddress, toReceive, function(err, data){
			if(err){
				alert('Couldnt contact server!');
			}
			else {
				window.location.replace("http://coinpair.com/track.html?id=" + data.secureid);
			}
		});
		
	}
}

function spinner() {
	$('.place-order').hide();
	new Spinner({
		color: '#000',
		lines: 10,
		top: 'auto',
		left: 'auto'
	}).spin(document.getElementById("spinner"));
}

function decimalPlaces(num) {
	var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
	if (!match) {
		return 0;
	}
	return Math.max(
		0,
		// Number of digits right of decimal point.
		(match[1] ? match[1].length : 0)
		// Adjust for scientific notation.
		- (match[2] ? +match[2] : 0));
}

function calculateRate(pair, callback) {
	$.ajax({
		url: window.serverAddress+"/rate/" + pair + "/",
		dataType: "jsonp",
		async: false,
		type: 'get',
		success: function(data) {
			callback(false, data.rate);
		},
		error: function() {
			callback(true);
		}
	});
}

function request(fromC, toC, address, amount, callback) {
	$.ajax({
		url: window.serverAddress + "/"+ fromC +"-"+ toC + "/" + address,
		dataType: "jsonp",
		async: false,
		type: 'get',
		success: function(data) {
			callback(false, data);
		},
		error: function() {
			callback(true);
		}
	});
}

function subscribe(address) {
	var socket = io.connect(window.serverAddress);

	socket.emit('subscribe', address);

	return socket;

}