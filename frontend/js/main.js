$(document).ready(function() {
	var socket = subscribe('cakeroom');

	socket.on('update', function(data){
		console.log(data);
	});

	$('#genAddy').click(function() {
		var from = $('#from').find(":selected").text();
		var to = $('#to').find(":selected").text();
		var addy = $('#forwardto').val();

		request(from + '-' + to, addy, function(err, data) {
			$("#addyfield").append(data.address + '<br/>');
			var response = subscribe(data.address);
			response.on('update', function(ndata){
				$("#addyfield").append('address: ' + ndata.address + ' confirmations: ' +ndata.confirmations+ '<br/>');
			});
		});
	});
});

function request(pair, address, callback) {
	$.ajax({
		url: "http://127.0.0.1:5000/" + pair + "/" + address,
		dataType: "jsonp",
		async: false,
		type: 'get',
		success: function(data) {
			callback(false, data);
		}
	});
}

function subscribe(address) {
	var socket = io.connect('http://localhost:5111');

	socket.emit('subscribe', address);

	return socket;

}