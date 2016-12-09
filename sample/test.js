
var fs = require( 'fs' ) ;
var jsbindat = require( '../lib/jsbindat.js' ) ;

var data = require( './sample1.json' ) ;
var stream = fs.createWriteStream( __dirname + '/out.jsdat' ) ;

jsbindat.serialize( data , stream , {} , function() {
	stream.end() ;
} ) ;



