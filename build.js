var NwBuilder = require('nw-builder');
var nw = new NwBuilder({
	files: [
		'./**/**', 
		'!./node_modules/nw-builder/**',
		'!./node_modules/mongodb/**',
		'!./node_modules/mongodb-core/**',
		'!.build/**',
		'!./.git'
	],
	platforms: ['win64', 'win32'],
	version: '0.17.4',
	flavor: 'normal',
	zip: true,
	buildDir: './build',
	cacheDir: '../nw-cache',
	appVersion: '0.0.1',
	appName: 'AddBatch'
});

nw.on('log', console.log);

nw.build().then(function () {
	console.log('Build finished');
}).catch(function(err) {
	console.log(err);
});