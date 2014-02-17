/**
 * Created by pcasaubon on 2/11/14.
 */
///<reference path="typings/node/node.d.ts"/>


import fs = require('fs');
import path = require('path');
import https = require('https');
var cheerio = require('../node_modules/cheerio');
var prompt = require('../node_modules/cli-prompt');
var mkdirp = require('../node_modules/mkdirp');
var Table = require('../node_modules/cli-table');
var clipboard:IClipboard = require("../node_modules/copy-paste").noConflict();

//clipboard.copy('AAAA')

interface IClipboard
{
	copy( text:string, cb?:()=>void ):void;
	paste( cb?:()=>void ):void;
}



export interface INtscModule
{
	name: string;
	path: string;
	sha: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	type: string;
	content: string;
	encoding: string;
}



export class NTSC
{
	private moduleDir:string;
	private modulesURL:string = "/repos/xperiments/ntsc/contents/modules";
	private rawFileURL:string = "https://api.github.com/repos/xperiments/ntsc/contents/";
	private commandsFile:string;
	private commandsContent:string;
	private $:any;

	constructor( private nodeBinDir:string, private processDir:string ){

		this.moduleDir = nodeBinDir+'/modules';


	}
	public processCommand( command:string, output:string ):void
	{
		var commandModule = command.split('.')[0];
		this.commandsFile= this.getCommandsPath( commandModule );


		this.commandsContent = <string><any>fs.readFileSync(this.commandsFile, {encoding:"utf8"});
		var $ = this.$ = cheerio['load']( this.commandsContent );
		var commands:any[] = [];
		if($('tss').length != 0 )
		{
			var el = $('tss[id="'+command+'"]')
			if( el.length>0 )
			{

				commands[ command ] = { context:{}, questions:{}, defaults:{},template:''}
				el.find('tss-var').each(function(iVar, elemVar) {
					commands[ command ]['context'][ $(this).attr('var') ] ="ND";
					commands[ command ]['questions'][ $(this).attr('var') ] =
					{
						label:$(this).attr('prompt'),
						default:$(this).attr('default'),
						key:$(this).attr('var')
					};
				});
				var prompts = [];
				Object.keys( commands[ command ]['questions']).map( (e)=>{

					prompts.push( commands[ command ]['questions'][e] )
				})

				prompts.push({
					label:"Is all this correct (y/n)",
					default:"y",
					key:"ntsc____correct"
				})

				prompt.multi(prompts,( result )=>
				{

					if( result.ntsc____correct.toLowerCase()!=="y")
					{
						process.exit(0);
					}

					// inject current user & date
					result['$USER'] = process.env['USER'];
					result['$DATE'] = (new Date()).toISOString().slice(0,10);

					console.log( '[ntsc] [O] Processing:', command );

					el.find('script').each(function(iVar, elemVar){
						var methods = eval( $(this).text() )
						Object.keys( methods ).map( (e)=>{
							result[e]=methods[e];
						})
					})
					var render = MicroMustache.render(el.find('tss-template').text(), result, this );
					var realOutput = output =="none" ? MicroMustache.render( el.attr('ouput'), result, this ):output;
					var dest = this.processDir + '/'+realOutput;

					if( el.attr('clipboard')=="" )
					{
						clipboard.copy( render,()=>
						{
							this.writeTemplate( dest, render, realOutput );
							console.log('Template copied to ClipBoard.');
						 });
					}
					else
					{
						this.writeTemplate( dest, render, realOutput );
					}
				});


			}


		}
		else
		{
			process.exit();
		}
	}

	private writeTemplate( dest:string, render:string, output )
	{
		if( !fs.existsSync( dest ))
		{
			mkdirp(path.dirname(dest), (err)=>{
				if (err)
				{
					console.error(err)
				}
				else
				{

					fs.writeFileSync( dest, render,{encoding:'utf8'});
				}
				console.log( '[ntsc] [+] Generated',output,'file.')
			});
		}
		else
		{
			fs.writeFileSync( dest, render,{encoding:'utf8'})
			console.log( '[ntsc] [+] Generated',output,'file.')
		}
	}

	public importCommand( command:string, view:any = {} ):void
	{

		var $ = this.$;
		var commands:any[] = [];
		if($('tss').length != 0 )
		{
			var el = $('tss[id="'+command+'"]')
			if( el.length>0 )
			{
				console.log( '[ntsc]	[o] Processing:', command );
				//result.toArray = function( elem ){ return JSON.stringify( this[elem].split(',') )}
				el.find('script').each(function(iVar, elemVar) {
					var methods = eval( $(this).text() )
					Object.keys( methods ).map( (e)=>{
						view[e]=methods[e];
					})
				})


				var render = MicroMustache.render(el.find('tss-template').text(), view, this );
				var hasOuput = el.attr('ouput');
				var output;
				if( hasOuput ) output = MicroMustache.render( hasOuput, view, this );

				var dest = this.processDir + '/'+output;
				if( !fs.existsSync( dest ))
				{
					mkdirp(path.dirname(dest), (err)=> {
						if (err) console.error(err)
						else fs.writeFileSync( dest, render,{encoding:'utf8'})
						console.log( '[ntsc]	[+] Generated',output,'file.')
					});
				}
				else
				{
					fs.writeFileSync( dest, render,{encoding:'utf8'})
					console.log( '[ntsc]	[+] Generated',output,'file.')
				}




			}


		}
	}

	public getCommandsPath( commandModule:string )
	{
		return this.nodeBinDir+'/modules/'+commandModule+'/'+commandModule+'.html';
	}


	// API
	public queryModules()
	{
		var options = {
			host:'api.github.com',
			path: this.modulesURL+'/modules.json',
			headers: {
				'User-Agent': 'ntsc'
			}
		};
		https.get( options, (res:any)=>{
			var response = "";
			res.on('data',(d)=>{response+=d});
			//the whole response has been recieved, so we just print it out here
			res.on('end', ()=>{
				var result = JSON.parse( response );
				var file:string = new Buffer( result.content.replace(/(\r\n|\n|\r)/gm,"") ,'base64').toString('utf8');
				var modules = JSON.parse( file );
				var table = new Table({
					head: ['module', 'description']
					, colWidths: [40, 80]
					, chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
				});
				modules.modules.map(( module:{name:string; description:string} )=>{
					table.push([ module.name, module.description]);
				})
				console.log( table.toString() );

			});

		}).on('error', (e)=> {
				console.log('Unable to load main repository config. Try latter please.');
				process.exit(0);
			});
	}

	public installModule( moduleName:string ):void
	{
		var options = {
			host:'api.github.com',
			path: this.modulesURL+'/'+moduleName+'/'+moduleName+'.html',
			headers: {
				'User-Agent': 'ntsc'
			}
		};
		https.get( options, (res:any)=>{
			var response = "";
			res.on('data',(d)=>{response+=d});
			//the whole response has been recieved, so we just print it out here
			res.on('end', ()=>{
				var result:INtscModule = <INtscModule>JSON.parse( response );
				if( result.hasOwnProperty("name") && result.hasOwnProperty("path") )
				{
					this.saveModule( moduleName, result );
					console.log( module+' installed.');
				}
				else
				{
					console.log( module+' not found');
					process.exit(0);
				}

			});

		}).on('error', (e)=> {
				console.log( module+' not found');
				process.exit(0);
			});
	}

	public uninstallModule( moduleName:string ):void
	{
		if( fs.existsSync(this.moduleDir+'/'+moduleName) )
		{
			NTSC.deleteFolderRecursive(this.moduleDir+'/'+moduleName);
			console.log( moduleName+' uninstalled.');
		}
		else
		{
			console.log( moduleName+' is not currently installed!')
		}
	}

	private saveModule( moduleName:string, result:INtscModule )
	{
		var moduleDir:string = this.nodeBinDir+'/modules/'+moduleName;
		if(!fs.existsSync(moduleDir)) fs.mkdirSync(moduleDir);
		var file:string = new Buffer( result.content.replace(/(\r\n|\n|\r)/gm,"") ,'base64').toString('utf8');
		fs.writeFileSync( moduleDir+'/'+moduleName+'.html', file, {encoding:'utf8'} )
	}


	private showModule( moduleName:string ):void
	{
		var htmlTemplate = fs.readFileSync( this.getCommandsPath( moduleName ) );
		var $ = this.$ = cheerio['load']( htmlTemplate );
		var commands = $('tss');
		var table = new Table({
			head: ['command', 'description']
			, colWidths: [40, 80]
			, chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
		});
		for( var i=0, el; i<commands.length; i++ )
		{
			el = $('tss').eq(i);
			table.push( [el.attr('id'), el.attr('description')])
		}
		console.log(table.toString());

	}

	static deleteFolderRecursive(path:string):void
	{
		if( fs.existsSync(path) ) {
			fs.readdirSync(path).forEach((file,index)=>{
				var curPath = path + "/" + file;
				if(fs.statSync(curPath).isDirectory()) { // recurse
					NTSC.deleteFolderRecursive(curPath);
				} else { // delete file
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(path);
		}
	}
}

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
	function render (template, view, ntsc ) {
		//don't touch the template if it is not a string
		if (typeof template !== 'string') {
			return template;
		}
		//if view is not a valid object, assume it is an empty object which effectively removes all variable assignments
		if (typeof view !== 'object' || view === null) {
			view = {};
		}
		return template.replace(/\{?\{\{\s*(.*?)\s*\}\}\}?/g, function (match, varName) {

			var clearArgs = varName.replace(/\(.*\)/, '');
			// specia import case
			if( clearArgs=="import" )
			{
				var args:string[] = varName.match(/\(.*\)/);
				var params = getCallingArgs( args[0], view ) ;
				ntsc.importCommand( params[0], params[1] )
				return "";
			}
			var value = view[clearArgs];
			switch (typeof value) {
				case 'string':
				case 'number':
				case 'boolean':
					return value;
				case 'function':
					var args:string[] = varName.match(/\(.*\)/);
					var params;
					args && args[0] && ( params = getCallingArgs( args[0],view ) );
					if( params ) return value.apply(view, params );
					//if the value is a function, call it passing the variable name
					return (value.bind(view)());
				default:
					//anything else will be replaced with an empty string. This includes object, array and null.
					return '';
			}
		});
	}
	function getCallingArgs( args , view = null )
	{
		var params = args.match(/\((.*)\)/);
		var fn;
		if( view )
		{
			fn = new Function("params",'return ['+params[1].replace(/\'/g,'"')+']' );
		}
		else
		{
			fn = new Function('return ['+params[1].replace(/\'/g,'"')+']');
		}

		return fn(view);
	}


	return {
		render:render,
		to_html:render
	};
})();
