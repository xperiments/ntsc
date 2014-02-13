#!/usr/bin/env node
var pkg = require("../package.json");
var path = require("path");
var TScaffold = require("../src/TScaffold.js").TScaffold;
var commander = require("commander");



commander
	.version(pkg.version)
	.usage('command [options]')
	.option("-o, --output <output>", "The resulting file", "tss-output")
	.parse(process.argv);



if(!process.argv[2]){
	console.log('[ntsc] No process provided');
	process.exit(1)
}

if( commander.command ) new TScaffold( path.join(__dirname, '..'), process.cwd(), process.argv[2], commander.output );

