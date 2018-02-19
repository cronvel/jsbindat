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



var StreamBuffer = require( 'stream-kit/lib/StreamBuffer.js' ) ;
var ClassMap = require( './ClassMap.js' ) ;
var common = require( './common.js' ) ;



async function unserialize( stream , options ) {
	var runtime = {
		streamBuffer: StreamBuffer.create( stream ) ,
		classMap: options && ( options.classMap instanceof ClassMap ) ? options.classMap : null ,
		refCount: 0 ,
		refs: []
	} ;

	return await getOneData( runtime ) ;
}



module.exports = unserialize ;



async function getOneData( runtime , callback ) {
	var structure = [ DATATYPE_TYPE ] ;

	runtime.refCount = 0 ;
	runtime.refs.length = 0 ;

	runtime.streamBuffer.defineStructure( structure , runtime ) ;

	runtime.streamBuffer.once( 'data' , ( data ) => {
		//console.log( '\nstructured data event:' , data ) ;
		callback( data.value ) ;
	} ) ;
}



var dataType = {} ;

function typeHandler( type , dataType , ctx , runtime ) {
	//console.log( '\ntypeHandler()' , type , dataType , ctx ) ;

	switch ( type ) {
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
			ctx.refId = runtime.refCount ++ ;
			runtime.refs[ ctx.refId ] = ctx.structuredData.value ;
			break ;
		case common.TYPE_ARRAY :
			ctx.refId = runtime.refCount ++ ;
			runtime.refs[ ctx.refId ] = [] ;
			ctx.structure.push( DATATYPE_OPEN_ARRAY ) ;
			break ;
		case common.TYPE_EMPTY_OBJECT :
			ctx.structuredData.value = {} ;
			ctx.refId = runtime.refCount ++ ;
			runtime.refs[ ctx.refId ] = ctx.structuredData.value ;
			break ;
		case common.TYPE_OBJECT :
			ctx.refId = runtime.refCount ++ ;
			runtime.refs[ ctx.refId ] = {} ;
			ctx.structure.push( DATATYPE_OPEN_OBJECT ) ;
			break ;
		case common.TYPE_INSTANCE :
			ctx.refId = runtime.refCount ++ ;
			runtime.refs[ ctx.refId ] = null ;
			ctx.structure.push( DATATYPE_OPEN_INSTANCE ) ;
			break ;
		case common.TYPE_CONSTRUCTED_INSTANCE :
			ctx.refId = runtime.refCount ++ ;
			runtime.refs[ ctx.refId ] = null ;
			ctx.structure.push( DATATYPE_OPEN_CONSTRUCTED_INSTANCE ) ;
			break ;
		case common.TYPE_REF :
			ctx.structure.push( DATATYPE_REF ) ;
			break ;
		case common.TYPE_EMPTY_SET :
			ctx.structuredData.value = new Set() ;
			ctx.refId = runtime.refCount ++ ;
			runtime.refs[ ctx.refId ] = ctx.structuredData.value ;
			break ;
		case common.TYPE_SET :
			ctx.refId = runtime.refCount ++ ;
			runtime.refs[ ctx.refId ] = new Set() ;
			ctx.structure.push( DATATYPE_OPEN_SET ) ;
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



function lpsHandler( size , dataType , ctx ) {
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



function arrayHandler( structuredList , dataType , ctx , runtime ) {
	//console.log( "ctx.refId: " , ctx.refId ) ;
	var i , iMax , key , array ;

	array = runtime.refs[ ctx.refId ] ;

	for ( i = 0 , iMax = structuredList.length ; i < iMax ; i ++ ) {
		array[ i ] = structuredList[ i ].value ;
	}

	return array ;
}



var DATATYPE_OPEN_ARRAY = StreamBuffer.createDataType( {
	type: 'open' ,
	structure: DATATYPE_TYPE ,
	key: 'value' ,
	handler: arrayHandler
} ) ;



function objectHandler( structuredList , dataType , ctx , runtime ) {
	//console.log( "ctx.refId: " , ctx.refId ) ;
	var i , iMax , key , object ;

	object = runtime.refs[ ctx.refId ] ;

	for ( i = 0 , iMax = structuredList.length - 1 ; i < iMax ; i += 2 ) {
		key = structuredList[ i ].value ;
		if ( typeof key !== 'string' ) { continue ; }
		object[ key ] = structuredList[ i + 1 ].value ;
	}

	return object ;
}



var DATATYPE_OPEN_OBJECT = StreamBuffer.createDataType( {
	type: 'open' ,
	structure: DATATYPE_TYPE ,
	key: 'value' ,
	handler: objectHandler
} ) ;



function instanceHandler( structuredList , dataType , ctx , runtime ) {
	//console.log( "ctx.refId: " , ctx.refId ) ;
	var i , iMax , key , object ;

	object = runtime.refs[ ctx.refId ] ;
	//console.log( "rf2:" , runtime.refs[ ctx.refId ] , structuredList ) ;

	if ( structuredList[ 1 ] && structuredList[ 1 ].value && typeof structuredList[ 1 ].value === 'object' ) {
		Object.assign( object , structuredList[ 1 ].value ) ;
	}

	return object ;
}



function instanceCreateHandler( structuredList , dataType , ctx , runtime ) {
	//console.log( "!!" ) ;
	var className ;

	if (
		! ( className = structuredList[ 0 ].value ) ||
		typeof className !== 'string' ||
		! runtime.classMap.classes[ className ]
	) {
		// We don't know how to construct this class, abort now...
		return ;
	}

	// Create the instance early, once we got the name, so references can works
	runtime.refs[ ctx.refId ] = Object.create( runtime.classMap.classes[ className ].prototype ) ;
	//console.log( "rf:" , runtime.refs[ ctx.refId ] ) ;
}



var DATATYPE_OPEN_INSTANCE = StreamBuffer.createDataType( {
	type: 'open' ,
	structure: DATATYPE_TYPE ,
	key: 'value' ,
	partialHandlers: [
		instanceCreateHandler	// After the className is received
	] ,
	handler: instanceHandler
} ) ;



function constructedInstanceHandler( structuredList , dataType , ctx , runtime ) {
	//console.log( "ctx.refId: " , ctx.refId ) ;
	var i , iMax , key , object ;

	object = runtime.refs[ ctx.refId ] ;
	//console.log( "rf2:" , runtime.refs[ ctx.refId ] , structuredList ) ;

	if ( structuredList[ 2 ] && structuredList[ 2 ].value && typeof structuredList[ 2 ].value === 'object' ) {
		Object.assign( object , structuredList[ 2 ].value ) ;
	}

	return object ;
}



function constructedInstanceCreateHandler( structuredList , dataType , ctx , runtime ) {
	//console.log( "!!" ) ;
	var className , args ;

	if (
		! ( className = structuredList[ 0 ].value ) ||
		typeof className !== 'string' ||
		! runtime.classMap.classes[ className ]
	) {
		// We don't know how to construct this class, abort now...
		return ;
	}

	args = structuredList[ 1 ].value ;
	if ( ! Array.isArray( args ) ) { args = [ args ] ; }

	// Create the instance early, once we got the name and the constructor's arguments, so references can works

	if ( runtime.classMap.classes[ className ].newConstructor ) {
		runtime.refs[ ctx.refId ] = Object.create( runtime.classMap.classes[ className ].prototype ) ;
		runtime.classMap.classes[ className ].newConstructor.apply( runtime.refs[ ctx.refId ] , args ) ;
	}
	else if ( runtime.classMap.classes[ className ].constructor ) {
		runtime.refs[ ctx.refId ] =
			runtime.classMap.classes[ className ].constructor.apply( runtime.refs[ ctx.refId ] , args ) ;
	}
	else {
		// We don't know how to construct this class, abort now...
		return ;
	}

	//console.log( "rf:" , runtime.refs[ ctx.refId ] ) ;
}



var DATATYPE_OPEN_CONSTRUCTED_INSTANCE = StreamBuffer.createDataType( {
	type: 'open' ,
	structure: DATATYPE_TYPE ,
	key: 'value' ,
	partialHandlers: [
		null ,
		constructedInstanceCreateHandler	// After the className and the constructor arguments are received
	] ,
	handler: constructedInstanceHandler
} ) ;



function refHandler( refId , dataType , ctx , runtime ) {
	//console.log( "unS refHandler" , refId , runtime.refs , runtime.refs[ refId ] ) ;
	return runtime.refs[ refId ] ;
}



var DATATYPE_REF = StreamBuffer.createDataType( {
	type: 'uint32' ,
	key: 'value' ,
	handler: refHandler
} ) ;



function setHandler( structuredList , dataType , ctx , runtime ) {
	//console.log( "ctx.refId: " , ctx.refId ) ;
	var i , iMax , key , set ;

	set = runtime.refs[ ctx.refId ] ;

	for ( i = 0 , iMax = structuredList.length ; i < iMax ; i ++ ) {
		set.add( structuredList[ i ].value ) ;
	}

	return set ;
}



var DATATYPE_OPEN_SET = StreamBuffer.createDataType( {
	type: 'open' ,
	structure: DATATYPE_TYPE ,
	key: 'value' ,
	handler: setHandler
} ) ;


