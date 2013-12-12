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

	this.find = function(type, metadata) {
		for (var i = 0; i < statArray.length; i++) {
			var element = statArray[i];
			if (element.type == type && element.metadata == metadata) {
				return element;
			}
		}
		return false;
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