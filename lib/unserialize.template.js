/*
	JS Binary Data
	
	Copyright (c) 2016 Cédric Ronvel
	
	The MIT License (MIT)
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



var StreamBuffer = require( './StreamBuffer.js' ) ;
var common = require( './common.js' ) ;

var depthLimit = Infinity ;
//#depthLimitValue -> depthLimit



function unserialize( stream , options , callback )
{
	if ( typeof options === 'function' ) { callback = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var runtime = {
		streamBuffer: StreamBuffer.create( stream )
		//i: 0
		, depth: 0	//# noDepthTracking!
		, depthLimit: options.limit || depthLimit   //# noDepthLimit!
		, ancestors: []	//# noRefNotation!
	} ;
	
	flow( runtime , callback ) ;
}



module.exports = unserialize ;



function flow( runtime , callback )
{
	var structure = [ DATATYPE_TYPE ] ;
	
	runtime.streamBuffer.defineStructure( structure ) ;
	
	runtime.streamBuffer.once( 'data' , function( data ) {
		console.log( '\nstructured data event:' , data ) ;
		callback( data.value ) ;
	} ) ;
}



var dataType = {} ;

function typeHandler( type , dataType , structuredData , structure )
{
	console.log( '\ntypeHandler()' , type , dataType , structuredData , structure ) ;
	
	switch ( type )
	{
		case common.TYPE_UNDEFINED :
			structuredData.value = undefined ;
			break ;
		case common.TYPE_NULL :
			structuredData.value = null ;
			break ;
		case common.TYPE_FALSE :
			structuredData.value = false ;
			break ;
		case common.TYPE_TRUE :
			structuredData.value = true ;
			break ;
		case common.TYPE_EMPTY_STRING :
			structuredData.value = '' ;
			break ;
		case common.TYPE_NUMBER :
			structure.push( DATATYPE_NUMBER ) ;
			break ;
		case common.TYPE_STRING_LPS_UTF8 :
			structure.push( DATATYPE_LPS ) ;
			structure.push( DATATYPE_UTF8 ) ;
			break ;
		case common.TYPE_EMPTY_ARRAY :
			structuredData.value = [] ;
			break ;
		case common.TYPE_ARRAY :
			structuredData.value = [] ;
			structure.push( DATATYPE_NESTED ) ;
			break ;
		case common.TYPE_EMPTY_OBJECT :
			structuredData.value = {} ;
			break ;
	}
	
	return type ;
}



var DATATYPE_TYPE = StreamBuffer.createDataType( {
	type: 'uint8' ,
	key: 'type' ,
	handler: typeHandler
} ) ;



var DATATYPE_NUMBER = StreamBuffer.createDataType( {
	type: 'number' ,
	key: 'value'
} ) ;



function lpsHandler( size , dataType , structuredData , structure , index )
{
	console.log( '\nlpsHandler()' , size , dataType , structuredData , structure , index ) ;
	
	// Set up the size for the next data
	structure[ index + 1 ] = Object.create( structure[ index + 1 ] ) ;
	structure[ index + 1 ].size = size ;
	
	return size ;
}



var DATATYPE_LPS = StreamBuffer.createDataType( {
	type: 'uint32' ,
	key: 'size' ,
	handler: lpsHandler
} ) ;



var DATATYPE_UTF8 = StreamBuffer.createDataType( {
	type: 'utf8' ,
	key: 'value'
} ) ;



var DATATYPE_NESTED = StreamBuffer.createDataType( {
	type: 'nested' ,
	structure: DATATYPE_TYPE ,
	key: 'elements' ,
	//handler: lpsHandler
} ) ;



