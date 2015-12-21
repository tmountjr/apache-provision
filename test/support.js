var s = require('../lib/support.js'),
	mock = require('mock-fs'),
	path = require('path'),
	sitesBasePath = '/usr/local/sites-available',
	confPath = '/etc/apache2/sites-available',
	enabledConfPath = '/etc/apache2/sites-enabled',
	flagsPath = '/usr/local/flags';

module.exports = {

	base: {
		testGetNormalizedFolderName: function(test) {
			var expected = 'test-project',
				inputFolderName = 'Test Project';

			test.equal(expected, s.getNormalizedFolderName(inputFolderName));
			test.done();
		},

		testGetDirectories: function(test) {
			var fs = require('fs'),
				expected = ['b', 'c'],
				directoryStructure = {
					'./a': {
						'b': {},
						'c': {}
					}
				};

			// test a generic, expected case
			mock(directoryStructure);
			test.deepEqual(expected, s.getSubdirectories('./a'));

			// test with extraneous file in the root directory
			directoryStructure['./a']['file.txt'] = 'test file';
			mock(directoryStructure);
			test.deepEqual(expected, s.getSubdirectories('./a'));

			// restore the base fs object
			mock.restore();
			test.done();
		},

		testGetMD5: function(test) {
			var inpString = 'test',
				expected = '098f6bcd4621d373cade4e832627b4f6';

			test.equal(expected, s.getMD5(inpString));
			test.done();
		},

		testGetSerializedConfName: function(test) {
			var expected = '20-bd58c8-test-project.conf',
				input = 'test-project';

			test.equal(expected, s.getSerializedConfName(input));
			test.done();
		},

		testSetApacheDirtyFlag: function(test) {
			var fs = require('fs'),
				dirStructure = {};

			dirStructure[flagsPath] = {};

			mock(dirStructure);
			test.doesNotThrow(function() {
				s.setApacheDirtyFlag();
				var foo = fs.statSync(flagsPath + '/apache-dirty');
			});
			mock.restore();
			test.done();
		}
	},

	usingBasePath: {
		testGetLockFileName: function(test) {
			var inputFolderName = 'test-project',
				expected = sitesBasePath + '/' + inputFolderName + '.lock';

			test.equal(expected, s.getLockFileName(inputFolderName));
			test.done();
		},

		testCreateLockFile: function(test) {
			var inputFolderName = 'test-project',
				dirObject = {};

			dirObject[sitesBasePath] = {};
			mock(dirObject);
			test.doesNotThrow(function() {
				s.createLockFile(inputFolderName);
			});
			test.ok(s.lockFileExists(inputFolderName));
			mock.restore();
			test.done();
		},

		testLockFileExists: function(test) {
			var inputFolderNamePositive = 'test-project',
				inputFolderNameNegative = 'foo',
				dirObject = {};

			dirObject[sitesBasePath + '/' + inputFolderNamePositive + '.lock'] = '';

			mock(dirObject);
			test.ok(s.lockFileExists(inputFolderNamePositive));
			test.equal(false, s.lockFileExists(inputFolderNameNegative))
			mock.restore();
			test.done();
		},

		testDeleteLockFile: function(test) {
			var inputFolderName = 'test-project',
				dirObject = {};

			dirObject[sitesBasePath + '/' + inputFolderName + '.lock'] = '';
			mock(dirObject);
			test.doesNotThrow(function() {
				s.deleteLockFile(inputFolderName);
			});
			test.equal(false, s.lockFileExists(inputFolderName));
			mock.restore();
			test.done();
		},
	},

	usingConfPath: {
		testConfFileExists: function(test) {
			var dirObject = {};

			dirObject[confPath + '/20-bd58c8-test-project.conf'] = '';
			mock(dirObject);
			test.ok(s.confFileExists('test-project'));
			mock.restore();
			test.done();
		},

		testLink: function(test) {
			var dirObject = {},
				fs = require('fs'),
				sourceConfFile = path.join(confPath, '20-bd58c8-test-project.conf'),
				targetConfFile = path.join(enabledConfPath, '20-bd58c8-test-project.conf');

			dirObject[sourceConfFile] = '';
			dirObject[enabledConfPath] = {};

			mock(dirObject);

			test.doesNotThrow(function() {
				s.template.link('test-project');
				var foo = fs.lstatSync(targetConfFile);
			});
			test.ok(fs.lstatSync(targetConfFile).isSymbolicLink());

			mock.restore();
			test.done();
		}
	},

	endToEnd: {
		testTemplateCreate: function(test) {
			var inputFolderName = 'test-project',
				rawTemplate = 'Subdomain at {{docroot}}/{{subdomain}}.',
				dirObject = {};

			dirObject[confPath] = dirObject[sitesBasePath] = dirObject[flagsPath] =  dirObject[enabledConfPath] = {};

			mock(dirObject);

			// test that the template creation routine doesn't cause an error
			test.doesNotThrow(function() {
				s.template.create(rawTemplate, inputFolderName);
			});

			// test that the conf file was actually created as expected
			test.ok(s.confFileExists(inputFolderName));

			// test that the contents of the conf file are what we expect
			var fs = require('fs'),
				expected = 'Subdomain at ' + sitesBasePath + '/test-project.',
				confFileName = s.getSerializedConfName(inputFolderName),
				actual = fs.readFileSync(path.join(confPath, confFileName)).toString();

			test.equal(expected, actual);

			// restore the filesystem
			mock.restore();
			test.done();
		},
	},

};
