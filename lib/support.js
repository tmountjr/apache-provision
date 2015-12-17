var fs = require('fs'),
	path = require('path');

module.exports = {

	getSubdirectories: function(basePath) {
		return fs.readdirSync(basePath).filter(function(file) {
			return fs.statSync(path.join(basePath, file)).isDirectory() && file.substr(0, 1) !== '.';
		});
	}

}