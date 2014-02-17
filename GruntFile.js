var fs = require('fs');
var cheerio = require('cheerio');
module.exports = function(grunt) {

	// load the task
	grunt.loadNpmTasks("grunt-ts");
	// simple task that generates a list of avaliable modules
	grunt.registerTask('ntsc-module', 'Log some stuff.', function(){
		var modulesJson = {"modules":[]}
		var dirListing = fs.readdirSync('./modules');
		dirListing = dirListing.filter( function( file ){ return file!=="modules.json"})

		dirListing.map( function( dirname ){
			var fileContents = fs.readFileSync('./modules/'+dirname+'/'+dirname+'.html', {encoding:"utf8"});
			var $ = cheerio['load']( fileContents );
			modulesJson.modules.push({ "name":dirname, "description":$('tss-module').eq(0).attr('description')})
		})
		fs.writeFileSync('./modules/modules.json', JSON.stringify(modulesJson, null, '	'),{encoding:"utf8"} )
		grunt.log.write('Updated modules/modules.json');
	});

	grunt.registerTask('node-executable', 'Add #!/usr/bin/env node', function( ){

		var file = grunt.config("nodeExecutable");
		var fileContents = fs.readFileSync(file, {encoding:"utf8"});
		fs.writeFileSync(file, "#!/usr/bin/env node\n"+fileContents,{encoding:"utf8"} )
		grunt.log.write("Updated executable file");
	});


	grunt.initConfig(
		{
			nodeExecutable:"./lib/bin.js",
			ts:
			{
				dev: {
					src: [
						"./src/**/*.ts",
					],        // The source typescript files, http://gruntjs.com/configuring-tasks#files
					reference: "./src/reference.ts",  // If specified, generate this file that you can use for your reference management
					watch: './src',                     // If specified, watches this directory for changes, and re-runs the current target
					outDir:'./lib',
					options: {                         // use to override the default options, http://gruntjs.com/configuring-tasks#options
						target: 'es3',                 // 'es3' (default) | 'es5'
						module: 'commonjs',            // 'amd' (default) | 'commonjs'
						sourceMap: false,               // true (default) | false
						declaration: false,            // true | false (default)
						removeComments: true           // true (default) | false
					},
					shebang:'./src/bin.ts'
				}
			}
		});

	grunt.registerTask("default", ["ts:dev"]);
	grunt.registerTask("generate-modules");

};