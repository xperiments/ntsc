/**
 * Created by pcasaubon on 2/11/14.
 */
///<reference path="typings/node/node.d.ts"/>

// ntsc --remove angular
// ntsc --install angular
// ntsc --list angular

import fs = require('fs');
import path = require('path');
var cheerio = require('../node_modules/cheerio');
var prompt = require('../node_modules/cli-prompt');
var mkdirp = require('../node_modules/mkdirp');
export class TScaffold
{
	private commandsFile:string;
	private commandsContent:string;
	private $:any;
	constructor( private nodeBinDir:string, private processDir:string, command:string, private output:string )
	{
		var commandModule = command.split('.')[0];
		this.commandsFile= this.getCommandsPath( commandModule );
		this.processCommand(command);

	}
	public processCommand( command:string ):void
	{

		this.commandsContent = fs.readFileSync(this.commandsFile, {encoding:"utf8"});
		var $ = this.$ = cheerio.load( this.commandsContent );
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
					//result.toArray = function( elem ){ return JSON.stringify( this[elem].split(',') )}
					el.find('script').each(function(iVar, elemVar) {
						var methods = eval( $(this).text() )
						Object.keys( methods ).map( (e)=>{
							result[e]=methods[e];
						})
					})
					var render = MicroMustache.render(el.find('tss-template').text(), result, this );
					var hasOuput = el.attr('ouput');

					if( hasOuput ) this.output = MicroMustache.render( hasOuput, result, this );
					var dest = this.processDir + '/'+this.output;
					if( !fs.existsSync( dest ))
					{
						mkdirp(path.dirname(dest), (err)=> {
							if (err) console.error(err)
							else fs.writeFileSync( dest, render,{encoding:'utf8'})
							console.log( '[ntsc] [+] Generated',this.output,'file.')
						});
					}
					else
					{
						fs.writeFileSync( dest, render,{encoding:'utf8'})
						console.log( '[ntsc] [+] Generated',this.output,'file.')
					}

				});


			}


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

				if( hasOuput ) this.output = MicroMustache.render( hasOuput, view, this );

				var dest = this.processDir + '/'+this.output;
				if( !fs.existsSync( dest ))
				{
					mkdirp(path.dirname(dest), (err)=> {
						if (err) console.error(err)
						else fs.writeFileSync( dest, render,{encoding:'utf8'})
						console.log( '[ntsc]	[+] Generated',this.output,'file.')
					});
				}
				else
				{
					fs.writeFileSync( dest, render,{encoding:'utf8'})
					console.log( '[ntsc]	[+] Generated',this.output,'file.')
				}




			}


		}
	}
	public getCommandsPath( commandModule:string )
	{
		return this.nodeBinDir+'/modules/'+commandModule+'.html';
	}
	public _getCommandsPath()
	{
		var upDirLimit:number = 50;
		var parentPath:string ="../..";

		if( fs.existsSync(this.processDir+'/package.json') )
		{
			if( !fs.existsSync(this.processDir+'/tss.html' ) )
			{
				console.log('No tss file');
				process.exit(0);
			}
			return this.processDir+'/tss.html';
		}

		// find package.json
		while( upDirLimit-- )
		{
			if( fs.existsSync( path.join(this.processDir, parentPath, 'package.json') ) )
			{
				break;
			}
			parentPath+="/..";
		}

		// no package.json
		if( upDirLimit==-1 )
		{
			console.log('package.json not found');
			process.exit(0);
		}

		if(!fs.existsSync( path.join(this.processDir, parentPath, 'tss.html') ) )
		{
			console.log('No tss file');
			process.exit(0);
		}

		return path.join(this.processDir, parentPath, 'tss.html');

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
