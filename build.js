var NwBuilder = require('nw-builder');
var nw = new NwBuilder({
	files: [
		'./**/**', 
		'!./node_modules/nw-builder/**',
		'!./node_modules/mongodb/**',
		'!./node_modules/mongodb-core/**',
		'!.build/**',
		'!./.git',
		'!.scss/**'
	],
	platforms: ['win64', 'win32', 'osx64'],
	version: '0.17.4',
	flavor: 'normal',
	zip: true,
	buildDir: './build',
	cacheDir: '../nw-cache',
	appVersion: '1.0.0',
	appName: 'AddBatch'
});

nw.on('log', console.log);

nw.build().then(function () {
	console.log('Build finished');
}).catch(function(err) {
	console.log(err);
});