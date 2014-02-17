///<reference path="reference.ts"/>
var pkg = require("../package.json");
var path = require("path");
var NTSC = require("../src/NTSC.js").NTSC;
var commander = require("commander");
var ntsc = new NTSC(path.join(__dirname, '..'), process.cwd());
var clipboard = require("copy-paste").noConflict();
clipboard.copy('DEM2O', function () {
});
commander.version(pkg.version).usage('[module] [--actions]').option("-h, --help [module]", "List the current Avaliable modules", "none").option("-l, --list", "list the current Avaliable modules").option("-c, --current", "list the current Installed modules").option("-i, --install <module>", "installs the specified module").option("-u, --uninstall <module>", "uninstalls the specified module").option("-o, --output <output>", "output file", "none");

commander.parse(process.argv);

var actionModule = process.argv[2];

switch (true) {
    case commander.list != undefined:
        ntsc.queryModules();
        return;
        break;
    case commander.install != undefined:
        ntsc.installModule(commander.install);
        return;
        break;
    case commander.uninstall != undefined:
        ntsc.uninstallModule(commander.uninstall);
        return;
        break;
    case commander.help == "none" && actionModule.indexOf('-') != -1:
        commander.outputHelp();
        return;
        break;
    case commander.help != "none" && commander.help != undefined:
        ntsc.showModule(commander.help);
        return;
        break;
}
if (actionModule.indexOf('-') == -1) {
    ntsc.processCommand(process.argv[2], commander.output);
}
