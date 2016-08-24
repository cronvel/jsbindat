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
	if ( typeof options === 'function' ) { callback = options ; options = null ; }
	
	var runtime = {
		streamBuffer: StreamBuffer.create( stream )
		, classes: ( options && options.classes ) || null
		, depth: 0	//# noDepthTracking!
		, depthLimit: ( options && options.limit ) || depthLimit   //# noDepthLimit!
		, ancestors: []	//# noRefNotation!
	} ;
	
	getOneData( runtime , callback ) ;
}



module.exports = unserialize ;



function getOneData( runtime , callback )
{
	var structure = [ DATATYPE_TYPE ] ;
	
	runtime.streamBuffer.defineStructure( structure , runtime ) ;
	
	runtime.streamBuffer.once( 'data' , function( data ) {
		//console.log( '\nstructured data event:' , data ) ;
		callback( data.value ) ;
	} ) ;
}



var dataType = {} ;

function typeHandler( type , dataType , ctx )
{
	//console.log( '\ntypeHandler()' , type , dataType , ctx ) ;
	
	switch ( type )
	{
		case common.TYPE_CLOSE :
			ctx.closed = true ;
			break ;
		case common.TYPE_UNDEFINED :
			ctx.structuredData.value = undefined ;
			break ;
		case common.TYPE_NULL :
			ctx.structuredData.value = null ;
			break ;
		case common.TYPE_FALSE :
			ctx.structuredData.value = false ;
			break ;
		case common.TYPE_TRUE :
			ctx.structuredData.value = true ;
			break ;
		case common.TYPE_EMPTY_STRING :
			ctx.structuredData.value = '' ;
			break ;
		case common.TYPE_NUMBER :
			ctx.structure.push( DATATYPE_NUMBER ) ;
			break ;
		case common.TYPE_STRING_LPS8_UTF8 :
			ctx.structure.push( DATATYPE_LPS8 ) ;
			ctx.structure.push( DATATYPE_UTF8 ) ;
			break ;
		case common.TYPE_STRING_LPS_UTF8 :
			ctx.structure.push( DATATYPE_LPS ) ;
			ctx.structure.push( DATATYPE_UTF8 ) ;
			break ;
		case common.TYPE_EMPTY_ARRAY :
			ctx.structuredData.value = [] ;
			break ;
		case common.TYPE_ARRAY :
			ctx.structure.push( DATATYPE_OPEN_ARRAY ) ;
			break ;
		case common.TYPE_EMPTY_OBJECT :
			ctx.structuredData.value = {} ;
			break ;
		case common.TYPE_OBJECT :
			ctx.structure.push( DATATYPE_OPEN_OBJECT ) ;
			break ;
		case common.TYPE_INSTANCE :
			ctx.structure.push( DATATYPE_OPEN_INSTANCE ) ;
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



function lpsHandler( size , dataType , ctx )
{
	//console.log( '\nlpsHandler()' , size , dataType , ctx ) ;
	
	// Set up the size for the next data
	ctx.structure[ ctx.index + 1 ] = Object.create( ctx.structure[ ctx.index + 1 ] ) ;
	ctx.structure[ ctx.index + 1 ].size = size ;
	
	return size ;
}



var DATATYPE_LPS8 = StreamBuffer.createDataType( {
	type: 'uint8' ,
	key: 'size' ,
	handler: lpsHandler
} ) ;



var DATATYPE_LPS = StreamBuffer.createDataType( {
	type: 'uint32' ,
	key: 'size' ,
	handler: lpsHandler
} ) ;



var DATATYPE_UTF8 = StreamBuffer.createDataType( {
	type: 'utf8' ,
	key: 'value'
} ) ;



var DATATYPE_CLASS = StreamBuffer.createDataType( {
	type: 'utf8' ,
	key: 'class'
} ) ;



function arrayHandler( structuredList )
{
	return structuredList.map( e => e.value ) ;
}



var DATATYPE_OPEN_ARRAY = StreamBuffer.createDataType( {
	type: 'nested' ,
	structure: DATATYPE_TYPE ,
	key: 'value' ,
	handler: arrayHandler
} ) ;



function objectHandler( structuredList )
{
	var i , iMax , key , object = {} ;
	
	for ( i = 0 , iMax = structuredList.length - 1 ; i < iMax ; i += 2 )
	{
		key = structuredList[ i ].value ;
		if ( typeof key !== 'string' ) { continue ; }
		object[ key ] = structuredList[ i + 1 ].value ;
	}
	
	return object ;
}



var DATATYPE_OPEN_OBJECT = StreamBuffer.createDataType( {
	type: 'nested' ,
	structure: DATATYPE_TYPE ,
	key: 'value' ,
	handler: objectHandler
} ) ;



function instanceHandler( structuredList , dataType , ctx , runtime )
{
	var arg , className ;
	
	if (
		! structuredList.length ||
		! ( className = structuredList[ 0 ].value ) ||
		typeof className !== 'string' ||
		! runtime.classes[ className ]
	)
	{
		// Don't know how to construct this class, abort now...
		return null ;
	}
	
	arg = structuredList[ 1 ] && structuredList[ 1 ].value ;
	
	return runtime.classes[ className ].call( undefined , arg ) ;
}



var DATATYPE_OPEN_INSTANCE = StreamBuffer.createDataType( {
	type: 'nested' ,
	structure: DATATYPE_TYPE ,
	key: 'value' ,
	handler: instanceHandler
} ) ;


