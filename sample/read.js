
var fs = require( 'fs' ) ;
var jsbindat = require( '../lib/jsbindat.js' ) ;

var string = require( 'string-kit' ) ;

var stream = fs.createReadStream( __dirname + '/out.jsdat' ) ;

jsbindat.unserialize( stream , {} , function( udata ) {
	
	console.log( "After serialize/unserialize:\n" + string.inspect( { style: "color" , depth: Infinity } , udata ) ) ;
} ) ;



