function stats() {
	var self = this;
	var statArray = [];

	this.update = function(type, metadata, count, total) {
		for (var i = 0; i < statArray.length; i++) {
			var element = statArray[i];
			if (element.type == type && element.metadata == metadata) {
				statArray.splice(i, 1);
			}
		}
		statArray.push({
			type: type,
			metadata: metadata,
			count: count,
			total: total
		});
	}
	this.list = function() {
		return statArray;
	}
	this.dump = function() {
		statArray = [];
	}
	this.find = function(type, metadata) {
		for (var i = 0; i < statArray.length; i++) {
			var element = statArray[i];
			if (element.type == type && element.metadata == metadata) {
				return element;
			}
		}
		return false;
	}

	this.add = function(type, metadata, amount) {
		var found = self.find(type, metadata);
		if (found) amount += found.total;
		self.update(type, metadata, 1, amount);
	}

	this.average = function(type, metadata, data) {
		var find = self.find(type, metadata);
		var count = 1,
			total = data;
		if (find) {
			count = find.count + 1;
			total = find.total + data;
		}
		self.update(type, metadata, count, total);
	}
}

module.exports = stats;