$(".paragraphtitle").click(function(event){
	var id = event.target.id;
	$('#' + id + '-slide').slideToggle();
	var currentCtrl = $('#' + id + '-ctrl').html();
	if(currentCtrl== "+"){
		$('#' + id + '-ctrl').html("-");
	}
	else {
		$('#' + id + '-ctrl').html("+")
	}
});


$(".dropdown-menu li a").click(function() {
	var selText = $(this).text();
	$(this).parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
});
var from = false,
	to = false,
	toReceive = 0,
	rAddress = false;


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
	if (from.length > 0 & to.length > 0 & rAddress.length > 0) {
		place();
	} else {
		if (!rAddress || rAddress.length == 0) {
			alert('Please specify a receiving address!' + rAddress.length);
		} else if (!from || !to) {
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
			if (firstAmount == 1) {
				$(element).html(firstAmount + ' ' + from + ' = ' + amount + ' ' + to);
			} else {
				$(element).html('~' + firstAmount + ' ' + from + ' = ' + amount + ' ' + to);
			}


		}
	});

}

function place() {
	if (from && to) {
		spinner();
		request(from, to, rAddress, toReceive, function(err, data) {
			if (err) {
				showError('.conversion-div', err);
				$('#spinner').hide();
				$('.place-order').show();
			} else {

				window.location.replace("http://coinpair.com/beta/track.html?id=" + data.secureid);

			}
		});

	}
}

function showError(element, message) {
	console.log('Showing!');
	$(element).prepend('<div class="alert alert-danger tempremove"><b>Error:</b> ' + message + '</div>');
	setTimeout(function() {
		$(element + ' .tempremove').slideUp();
		setTimeout(function() {
			$(element + ' .tempremove').remove();
		}, 500);
	}, 2000);
}

function spinner() {
	$('.place-order').hide();
	$('#spinner').show();
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
$(document).ajaxError(function() {
	alert("An error occurred!");
});

function calculateRate(pair, callback) {
	$.ajax({
		url: window.serverAddress + "/rate/" + pair + "/",
		dataType: "jsonp",
		async: false,
		type: 'get',
		timeout: 2000,
		success: function(data) {
			if (isset(data.error)) {
				callback(data.error);
			} else {
				callback(false, data.rate);
			}
		},
		fail: function() {
			callback("clientside error");
		}
	});
}

function request(fromC, toC, address, amount, callback) {
	$.ajax({
		url: window.serverAddress + "/" + fromC + "-" + toC + "/" + address,
		dataType: "jsonp",
		async: false,
		type: 'get',
		timeout: 2000,
		success: function(data) {
			if (isset(data.error)) {
				callback(data.error);
			} else {

				callback(false, data);
			}
		},
		error: function() {
			callback("clientside error");
		}
	});
}

function subscribe(address) {
	var socket = io.connect(window.serverAddress);

	socket.emit('subscribe', address);

	return socket;

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