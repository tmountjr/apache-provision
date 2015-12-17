var s = require('../lib/support.js'),
	mock = require('mock-fs');

module.exports = {

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
	}

};
