$(document).ready(function() {
	$('#genAddy').click(function(){
		var from = $('#from').find(":selected").text();
		var to = $('#to').find(":selected").text();
		var addy = $('#forwardto').val();

		request(from + '-' + to, addy, function(err, data){
			$("#addyfield").append(data.address+ '<br/>');
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