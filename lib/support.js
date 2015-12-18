var fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	Promise = require('bluebird'),
	fsP = Promise.promisifyAll(require('fs')),
	handlebars = require('handlebars');

module.exports = {

	// set some defaults. These can overridden by calling setSitesBasePath and setConfPath.
	sitesBasePath: '/usr/local/sites-available',
	confPath: '/etc/apache2/sites-available',

	setSitesBasePath: function(basePath) {
		this.sitesBasePath = path.normalize(basePath);
	},

	setConfPath: function(confPath) {
		this.confPath = path.normalize(confPath);
	},

	getNormalizedFolderName: function(folderName) {
		return folderName.replace(/[^\w-\.]/g, '-').toLowerCase();
	},

	getSubdirectories: function(basePath) {
		if (! basePath) basePath = this.sitesBasePath;
		return fs.readdirSync(basePath).filter(function(file) {
			return fs.statSync(path.join(basePath, file)).isDirectory() && file.substr(0, 1) !== '.';
		});
	},

	getMD5: function(inpString) {
		return crypto.createHash('md5').update(inpString).digest('hex');
	},

	getSerializedConfName: function(folderName) {
		folderName = this.getNormalizedFolderName(folderName);
		var md5 = this.getMD5(folderName).substr(0, 6);
		return md5 + '-' + folderName + '.conf';
	},

	getLockFileName: function(folderName) {
		folderName = this.getNormalizedFolderName(folderName);
		return path.join(this.sitesBasePath, folderName) + ".lock";
	},

	createLockFile: function(folderName) {
		folderName = this.getNormalizedFolderName(folderName);

		var target = path.join(this.sitesBasePath, folderName) + '.lock';
		fs.closeSync(fs.openSync(target, 'w'));
	},

	deleteLockFile: function(folderName) {
		folderName = this.getNormalizedFolderName(folderName);
		if (this.lockFileExists(folderName)) {
			var lock = this.getLockFileName(folderName);
			fs.unlinkSync(lock);
		}
	},

	lockFileExists: function(folderName) {
		folderName = this.getNormalizedFolderName(folderName);
		try {
			var lockStat = fs.statSync(this.getLockFileName(folderName));
			return true;
		} catch (e) {
			return false;
		}
	},

	confFileExists: function(folderName) {
		folderName = this.getNormalizedFolderName(folderName);
		var targetConfName = this.getSerializedConfName(folderName);

		try {
			var conf = fs.statSync(path.join(this.confPath, targetConfName));
			return true;
		} catch (e) {
			return false;
		}
	},

	createConfFile: function(folderName) {
		fsP.readFileAsync('./templates/conf.hbs')
			.then(function(src) {
				module.exports.template.create(src, folderName);
			})
			.then(function() {
				module.exports.template.log(folderName);
			})
			.catch(function(error) {
				module.exports.template.err(error, folderName);
			})
			.finally(function() {
				module.exports.deleteLockFile(folderName);
			});
	},

	template: {
		create: function(templateContents, folderName) {
			module.exports.createLockFile(folderName);
			
			var data = {
					'subdomain': module.exports.getNormalizedFolderName(folderName),
					'docroot': module.exports.sitesBasePath
				},
				template = handlebars.compile(templateContents.toString()),
				conf = template(data),
				target = path.join(module.exports.confPath, module.exports.getSerializedConfName(folderName));

			fs.writeFileSync(target, conf);
		},

		log: function(folderName) {
			var target = path.join(module.exports.confPath, module.exports.getSerializedConfName(folderName));
			console.log("Conf file created at " + target);
		},

		err: function(error, folderName) {
			var target = path.join(module.exports.confPath, module.exports.getSerializedConfName(folderName));
			console.log('Error while writing ' + target + ': ' + error);
		}
	}

}