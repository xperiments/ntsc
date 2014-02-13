/**
* Created by pcasaubon on 2/11/14.
*/
///<reference path="typings/node/node.d.ts"/>
// ntsc --remove angular
// ntsc --install angular
// ntsc --list angular
var fs = require('fs');
var path = require('path');
var https = require('https');
var cheerio = require('../node_modules/cheerio');
var prompt = require('../node_modules/cli-prompt');
var mkdirp = require('../node_modules/mkdirp');
var Table = require('../node_modules/cli-table');
require("copy-paste");

var NTSC = (function () {
    function NTSC(nodeBinDir, processDir) {
        this.nodeBinDir = nodeBinDir;
        this.processDir = processDir;
        this.modulesURL = "/repos/xperiments/ntsc/contents/modules";
        this.rawFileURL = "https://api.github.com/repos/xperiments/ntsc/contents/";
        this.moduleDir = nodeBinDir + '/modules';
    }
    NTSC.prototype.processCommand = function (command, output) {
        var _this = this;
        var commandModule = command.split('.')[0];
        this.commandsFile = this.getCommandsPath(commandModule);

        this.commandsContent = fs.readFileSync(this.commandsFile, { encoding: "utf8" });
        var $ = this.$ = cheerio['load'](this.commandsContent);
        var commands = [];
        if ($('tss').length != 0) {
            var el = $('tss[id="' + command + '"]');
            if (el.length > 0) {
                commands[command] = { context: {}, questions: {}, defaults: {}, template: '' };
                el.find('tss-var').each(function (iVar, elemVar) {
                    commands[command]['context'][$(this).attr('var')] = "ND";
                    commands[command]['questions'][$(this).attr('var')] = {
                        label: $(this).attr('prompt'),
                        default: $(this).attr('default'),
                        key: $(this).attr('var')
                    };
                });
                var prompts = [];
                Object.keys(commands[command]['questions']).map(function (e) {
                    prompts.push(commands[command]['questions'][e]);
                });

                prompts.push({
                    label: "Is all this correct (y/n)",
                    default: "y",
                    key: "ntsc____correct"
                });

                prompt.multi(prompts, function (result) {
                    if (result.ntsc____correct.toLowerCase() !== "y") {
                        process.exit(0);
                    }

                    // inject current user & date
                    result['$USER'] = process.env['USER'];
                    result['$DATE'] = (new Date()).toISOString().slice(0, 10);

                    console.log('[ntsc] [O] Processing:', command);

                    //result.toArray = function( elem ){ return JSON.stringify( this[elem].split(',') )}
                    el.find('script').each(function (iVar, elemVar) {
                        var methods = eval($(this).text());
                        Object.keys(methods).map(function (e) {
                            result[e] = methods[e];
                        });
                    });
                    var render = MicroMustache.render(el.find('tss-template').text(), result, _this);
                    var hasOuput = el.attr('ouput');
                    var output;
                    if (hasOuput)
                        output = MicroMustache.render(hasOuput, result, _this);
                    var dest = _this.processDir + '/' + output;
                    if (!fs.existsSync(dest)) {
                        mkdirp(path.dirname(dest), function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                fs.writeFileSync(dest, render, { encoding: 'utf8' });
                            }
                            console.log('[ntsc] [+] Generated', output, 'file.');
                        });
                    } else {
                        fs.writeFileSync(dest, render, { encoding: 'utf8' });
                        console.log('[ntsc] [+] Generated', output, 'file.');
                    }
                });
            }
        }
    };

    NTSC.prototype.importCommand = function (command, view) {
        if (typeof view === "undefined") { view = {}; }
        var $ = this.$;
        var commands = [];
        if ($('tss').length != 0) {
            var el = $('tss[id="' + command + '"]');
            if (el.length > 0) {
                console.log('[ntsc]	[o] Processing:', command);

                //result.toArray = function( elem ){ return JSON.stringify( this[elem].split(',') )}
                el.find('script').each(function (iVar, elemVar) {
                    var methods = eval($(this).text());
                    Object.keys(methods).map(function (e) {
                        view[e] = methods[e];
                    });
                });

                var render = MicroMustache.render(el.find('tss-template').text(), view, this);
                var hasOuput = el.attr('ouput');
                var output;
                if (hasOuput)
                    output = MicroMustache.render(hasOuput, view, this);

                var dest = this.processDir + '/' + output;
                if (!fs.existsSync(dest)) {
                    mkdirp(path.dirname(dest), function (err) {
                        if (err)
                            console.error(err);
else
                            fs.writeFileSync(dest, render, { encoding: 'utf8' });
                        console.log('[ntsc]	[+] Generated', output, 'file.');
                    });
                } else {
                    fs.writeFileSync(dest, render, { encoding: 'utf8' });
                    console.log('[ntsc]	[+] Generated', output, 'file.');
                }
            }
        }
    };

    NTSC.prototype.getCommandsPath = function (commandModule) {
        return this.nodeBinDir + '/modules/' + commandModule + '/' + commandModule + '.html';
    };

    // API
    NTSC.prototype.queryModules = function () {
        var options = {
            host: 'api.github.com',
            path: this.modulesURL,
            headers: {
                'User-Agent': 'ntsc'
            }
        };
        https.get(options, function (res) {
            var response = "";
            res.on('data', function (d) {
                response += d;
            });

            //the whole response has been recieved, so we just print it out here
            res.on('end', function () {
                var modules = JSON.parse(response);
                modules.map(function (entry) {
                    if (entry.type == "dir")
                        console.log('----', entry.name);
                });
                process.exit(0);
            });
        }).on('error', function (e) {
            console.error(e);
        });
    };

    NTSC.prototype.installModule = function (moduleName) {
        var _this = this;
        var options = {
            host: 'api.github.com',
            path: this.modulesURL + '/' + moduleName + '/' + moduleName + '.html',
            headers: {
                'User-Agent': 'ntsc'
            }
        };
        https.get(options, function (res) {
            var response = "";
            res.on('data', function (d) {
                response += d;
            });

            //the whole response has been recieved, so we just print it out here
            res.on('end', function () {
                var result = JSON.parse(response);
                if (result.hasOwnProperty("name") && result.hasOwnProperty("path")) {
                    _this.saveModule(moduleName, result);
                    console.log(module + ' installed.');
                } else {
                    console.log(module + ' not found');
                    process.exit(0);
                }
            });
        }).on('error', function (e) {
            console.log(module + ' not found');
            process.exit(0);
        });
    };

    NTSC.prototype.uninstallModule = function (moduleName) {
        console.log(this.moduleDir + '/' + moduleName);
        if (fs.existsSync(this.moduleDir + '/' + moduleName)) {
            NTSC.deleteFolderRecursive(this.moduleDir + '/' + moduleName);
            console.log(moduleName + ' uninstalled.');
        } else {
            console.log(moduleName + ' is not currently installed!');
        }
    };

    NTSC.prototype.saveModule = function (moduleName, result) {
        var moduleDir = this.nodeBinDir + '/modules/' + moduleName;
        if (!fs.existsSync(moduleDir))
            fs.mkdirSync(moduleDir);
        var file = new Buffer(result.content.replace(/(\r\n|\n|\r)/gm, ""), 'base64').toString('utf8');
        fs.writeFileSync(moduleDir + '/' + moduleName + '.html', file, { encoding: 'utf8' });
    };

    NTSC.prototype.showModule = function (moduleName) {
        var htmlTemplate = fs.readFileSync(this.getCommandsPath(moduleName));
        var $ = this.$ = cheerio['load'](htmlTemplate);
        var commands = $('tss');
        var table = new Table({
            head: ['command', 'description'],
            colWidths: [40, 80],
            chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' }
        });
        for (var i = 0, el; i < commands.length; i++) {
            el = $('tss').eq(i);
            table.push([el.attr('id'), el.attr('description')]);
        }
        console.log(table.toString());
    };

    NTSC.deleteFolderRecursive = function (path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) {
                    NTSC.deleteFolderRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };
    return NTSC;
})();
exports.NTSC = NTSC;

/*!
* micromustache.js - A stripped down version of the {{mustache}} template engine with JavaScript
* @license Creative Commons V3
*/
var MicroMustache = (function () {
    /**
    * Replaces every {{variable}} inside the template with values provided by view
    * @param template {string} the template containing one or more {{key}}
    * @param view {object} an object containing string (or number) values for every key that is used in the template
    * @return {string} template with its valid variable names replaced with corresponding values
    */
    function render(template, view, ntsc) {
        if (typeof template !== 'string') {
            return template;
        }

        if (typeof view !== 'object' || view === null) {
            view = {};
        }
        return template.replace(/\{?\{\{\s*(.*?)\s*\}\}\}?/g, function (match, varName) {
            var clearArgs = varName.replace(/\(.*\)/, '');

            if (clearArgs == "import") {
                var args = varName.match(/\(.*\)/);
                var params = getCallingArgs(args[0], view);
                ntsc.importCommand(params[0], params[1]);
                return "";
            }
            var value = view[clearArgs];
            switch (typeof value) {
                case 'string':
                case 'number':
                case 'boolean':
                    return value;
                case 'function':
                    var args = varName.match(/\(.*\)/);
                    var params;
                    args && args[0] && (params = getCallingArgs(args[0], view));
                    if (params)
                        return value.apply(view, params);

                    //if the value is a function, call it passing the variable name
                    return (value.bind(view)());
                default:
                    //anything else will be replaced with an empty string. This includes object, array and null.
                    return '';
            }
        });
    }
    function getCallingArgs(args, view) {
        if (typeof view === "undefined") { view = null; }
        var params = args.match(/\((.*)\)/);
        var fn;
        if (view) {
            fn = new Function("params", 'return [' + params[1].replace(/\'/g, '"') + ']');
        } else {
            fn = new Function('return [' + params[1].replace(/\'/g, '"') + ']');
        }

        return fn(view);
    }

    return {
        render: render,
        to_html: render
    };
})();

