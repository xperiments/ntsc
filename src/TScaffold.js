/**
* Created by pcasaubon on 2/11/14.
*/
///<reference path="typings/node/node.d.ts"/>
// ntsc --remove angular
// ntsc --install angular
// ntsc --list angular
var fs = require('fs');
var path = require('path');
var cheerio = require('../node_modules/cheerio');
var prompt = require('../node_modules/cli-prompt');
var mkdirp = require('../node_modules/mkdirp');
var TScaffold = (function () {
    function TScaffold(nodeBinDir, processDir, command, output) {
        this.nodeBinDir = nodeBinDir;
        this.processDir = processDir;
        this.output = output;
        var commandModule = command.split('.')[0];
        this.commandsFile = this.getCommandsPath(commandModule);
        this.processCommand(command);
    }
    TScaffold.prototype.processCommand = function (command) {
        var _this = this;
        this.commandsContent = fs.readFileSync(this.commandsFile, { encoding: "utf8" });
        var $ = this.$ = cheerio.load(this.commandsContent);
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

                    if (hasOuput)
                        _this.output = MicroMustache.render(hasOuput, result, _this);
                    var dest = _this.processDir + '/' + _this.output;
                    if (!fs.existsSync(dest)) {
                        mkdirp(path.dirname(dest), function (err) {
                            if (err)
                                console.error(err);
else
                                fs.writeFileSync(dest, render, { encoding: 'utf8' });
                            console.log('[ntsc] [+] Generated', _this.output, 'file.');
                        });
                    } else {
                        fs.writeFileSync(dest, render, { encoding: 'utf8' });
                        console.log('[ntsc] [+] Generated', _this.output, 'file.');
                    }
                });
            }
        }
    };
    TScaffold.prototype.importCommand = function (command, view) {
        if (typeof view === "undefined") { view = {}; }
        var _this = this;
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

                if (hasOuput)
                    this.output = MicroMustache.render(hasOuput, view, this);

                var dest = this.processDir + '/' + this.output;
                if (!fs.existsSync(dest)) {
                    mkdirp(path.dirname(dest), function (err) {
                        if (err)
                            console.error(err);
else
                            fs.writeFileSync(dest, render, { encoding: 'utf8' });
                        console.log('[ntsc]	[+] Generated', _this.output, 'file.');
                    });
                } else {
                    fs.writeFileSync(dest, render, { encoding: 'utf8' });
                    console.log('[ntsc]	[+] Generated', this.output, 'file.');
                }
            }
        }
    };
    TScaffold.prototype.getCommandsPath = function (commandModule) {
        return this.nodeBinDir + '/modules/' + commandModule + '/' + commandModule + '.html';
    };
    TScaffold.prototype._getCommandsPath = function () {
        var upDirLimit = 50;
        var parentPath = "../..";

        if (fs.existsSync(this.processDir + '/package.json')) {
            if (!fs.existsSync(this.processDir + '/tss.html')) {
                console.log('No tss file');
                process.exit(0);
            }
            return this.processDir + '/tss.html';
        }

        while (upDirLimit--) {
            if (fs.existsSync(path.join(this.processDir, parentPath, 'package.json'))) {
                break;
            }
            parentPath += "/..";
        }

        if (upDirLimit == -1) {
            console.log('package.json not found');
            process.exit(0);
        }

        if (!fs.existsSync(path.join(this.processDir, parentPath, 'tss.html'))) {
            console.log('No tss file');
            process.exit(0);
        }

        return path.join(this.processDir, parentPath, 'tss.html');
    };
    return TScaffold;
})();
exports.TScaffold = TScaffold;

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

