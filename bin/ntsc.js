#!/usr/bin/env node
var pkg = require("../package.json");
var path = require("path");
var NTSC = require("../src/NTSC.js").NTSC;
var commander = require("commander");
var ntsc = new NTSC( path.join(__dirname, '..'), process.cwd() );
var clipboard = require("copy-paste").noConflict();
clipboard.copy('DEMO',function(){})
commander
	.version(pkg.version)
	.usage('[module] [--actions]')
	.option("-h, --help [module]", "List the current Avaliable modules","")
	.option("-l, --list", "list the current Avaliable modules")
	.option("-c, --current", "list the current Installed modules")
	.option("-i, --install <module>", "installs the specified module")
	.option("-u, --uninstall <module>", "uninstalls the specified module")
	.option("-o, --output <output>", "output file", "ntsc.tmp")


commander.parse(process.argv);

switch( true )
{
	case commander.list!=undefined:
		ntsc.queryModules();
		return
	break;
	case commander.install!=undefined:
		ntsc.installModule(commander.install);
		return;
	break;
	case commander.uninstall!=undefined:
		ntsc.uninstallModule(commander.uninstall);
		return;
	break;
	case commander.help!=undefined:
		commander.help == "" ? commander.outputHelp() : ntsc.showModule(commander.help);
		return
	break;
}

// get moduleName param
if(!process.argv[2]){
	console.log('[ntsc] No process provided');
	process.exit(1)
}

if( commander.command ) ntsc.processCommand( process.argv[2], commander.output );

