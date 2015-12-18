#!/usr/bin/env node

var s = require('./lib/support.js');

var sitesAvailable = s.getSubdirectories();
for (var i = 0; i < sitesAvailable.length; i++) {
	var thisSite = sitesAvailable[i];
	if (s.lockFileExists(thisSite)) continue;
	if (s.confFileExists(thisSite)) continue;

	// only if there's no lock file and no existing conf file should we continue.
	s.createConfFile(thisSite);
}