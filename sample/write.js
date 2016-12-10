
var fs = require( 'fs' ) ;
var jsbindat = require( '../lib/jsbindat.js' ) ;

var data = require( './sample1.json' ) ;
//var data = require( './sample2.js' ) ;
var stream = fs.createWriteStream( __dirname + '/out.jsdat' ) ;

var string = require( 'string-kit' ) ;

jsbindat.serialize( data , stream , {} , function() {
	stream.end() ;
} ) ;



