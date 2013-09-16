$(".dropdown-menu li a").click(function() {
	var selText = $(this).text();
	$(this).parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
});
var from = false,
	to = false,
	toReceive = 0;

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

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}
$(".fromcur li a").click(function() {
	from = $(this).text();
	clicked();
});

$(".tocur li a").click(function() {
	to = $(this).text();
	clicked();
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
			if(decimalPlaces(firstAmount) > 5){
				firstAmount = parseFloat((firstAmount).toFixed(5));
			}
			$(element).html(firstAmount + ' ' + from + ' = ' + amount + ' ' + to);

		}
	});

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
		url: "http://198.27.79.97/rate/" + pair + "/",
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