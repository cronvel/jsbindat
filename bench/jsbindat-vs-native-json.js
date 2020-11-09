
/* global benchmark, competitor */



const jsbindat = require( '..' ) ;
const fs = require( 'fs' ) ;



benchmark( 'JSON stringify(), real-world normal object' , () => {
	var sample = require( './sample/sample1.json' ) ;
	
	competitor( 'Native JSON.stringify()' , () => {
		JSON.stringify( sample ) ;
	} ) ;

	competitor( 'JSBinDat string serialization' , () => {
		jsbindat.strSerialize( sample ) ;
	} ) ;
} ) ;



benchmark( 'JSON parse(), real-world normal JSON' , () => {
	var jsonSample = fs.readFileSync( __dirname + '/sample/sample1.json' ).toString() ;
	var jsbindatSample = jsbindat.strSerialize( require( './sample/sample1.json' ) ) ;

	competitor( 'Native JSON.parse()' , () => {
		JSON.parse( jsonSample ) ;
	} ) ;
	
	competitor( 'JSBinDat string unserialization' , () => {
		jsbindat.strUnserialize( jsbindatSample ) ;
	} ) ;
} ) ;

