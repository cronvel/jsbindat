/*
	JS Binary Data

	Copyright (c) 2016 - 2018 Cédric Ronvel

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
var Unknown = require( './Unknown.js' ) ;
var common = require( './common.js' ) ;



async function unserialize( stream , options ) {
	options = options || {} ;
	var classMap = options.classMap ;
	if ( classMap && ! ( classMap instanceof ClassMap ) ) { classMap = new ClassMap( classMap ) ; }

	var runtime = {
		streamBuffer: StreamBuffer.create( stream ) ,
		classMap: classMap ,
		enableUnknown: options.enableUnknown ,
		refCount: 0 ,
		refs: []
	} ;

	return await unserializeData( runtime ) ;
}



module.exports = unserialize ;



async function unserializeData( runtime ) {
	runtime.refCount = 0 ;
	runtime.refs.length = 0 ;

	var type = await runtime.streamBuffer.readUInt8() ;

	return await unserializeAnyType( runtime , type ) ;
}



async function unserializeAnyType( runtime , type ) {
	var object ;

	switch ( type ) {

		// Constants

		case common.TYPE_UNDEFINED :
			return undefined ;
		case common.TYPE_NULL :
			return null ;
		case common.TYPE_TRUE :
			return true ;
		case common.TYPE_FALSE :
			return false ;
		case common.TYPE_ZERO :
			return 0 ;
		case common.TYPE_ONE :
			return 1 ;

		// Numbers

		case common.TYPE_NUMBER :
			return await runtime.streamBuffer.readNumber() ;
		case common.TYPE_UINT8 :
			return await runtime.streamBuffer.readUInt8() ;
		case common.TYPE_UINT16 :
			return await runtime.streamBuffer.readUInt16() ;
		case common.TYPE_UINT32 :
			return await runtime.streamBuffer.readUInt32() ;
		case common.TYPE_INT8 :
			return await runtime.streamBuffer.readInt8() ;
		case common.TYPE_INT16 :
			return await runtime.streamBuffer.readInt16() ;
		case common.TYPE_INT32 :
			return await runtime.streamBuffer.readInt32() ;

		// Strings

		case common.TYPE_EMPTY_STRING :
			return '' ;
		case common.TYPE_STRING_LPS8_UTF8 :
			return await runtime.streamBuffer.readLps8Utf8() ;
		case common.TYPE_STRING_LPS16_UTF8 :
			return await runtime.streamBuffer.readLps16Utf8() ;
		case common.TYPE_STRING_LPS32_UTF8 :
			return await runtime.streamBuffer.readLps32Utf8() ;

		// Arrays and the like

		case common.TYPE_EMPTY_ARRAY :
			object = [] ;
			runtime.refs[ runtime.refCount ++ ] = object ;
			return object ;
		case common.TYPE_ARRAY :
			return await unserializeArray( runtime ) ;
		case common.TYPE_EMPTY_SET :
			object = new Set() ;
			runtime.refs[ runtime.refCount ++ ] = object ;
			return object ;
		case common.TYPE_SET :
			return await unserializeSet( runtime ) ;

		// Objects and the like

		case common.TYPE_EMPTY_OBJECT :
			object = {} ;
			runtime.refs[ runtime.refCount ++ ] = object ;
			return object ;
		case common.TYPE_OBJECT :
			return await unserializeStrictObject( runtime ) ;
		case common.TYPE_EMPTY_MAP :
			object = new Map() ;
			runtime.refs[ runtime.refCount ++ ] = object ;
			return object ;
		case common.TYPE_MAP :
			return await unserializeMap( runtime ) ;
		case common.TYPE_EMPTY_INSTANCE :
			return await unserializeInstance( runtime , true ) ;
		case common.TYPE_INSTANCE :
			return await unserializeInstance( runtime ) ;
		case common.TYPE_CONSTRUCTED_INSTANCE :
			return await unserializeConstructedInstance( runtime ) ;

		// Buffers

		case common.TYPE_BUFFER :
			return await unserializeBuffer( runtime ) ;

		// Misc

		case common.TYPE_REF :
			return await unserializeRef( runtime ) ;
		case common.TYPE_CLOSE :
			throw new Error( "Unexpected close" ) ;
		default :
			throw new Error( "Not supported yet: 0x" + type.toString( 16 ) ) ;
	}
}



async function unserializeArray( runtime ) {
	var type , array = [] ;

	runtime.refs[ runtime.refCount ++ ] = array ;

	while ( ( type = await runtime.streamBuffer.readUInt8() ) !== common.TYPE_CLOSE ) {
		//console.log( "Type: 0x" + type.toString( 16 ) ) ;
		array.push( await unserializeAnyType( runtime , type ) ) ;
	}

	return array ;
}



async function unserializeSet( runtime ) {
	var type , set = new Set() ;

	runtime.refs[ runtime.refCount ++ ] = set ;

	while ( ( type = await runtime.streamBuffer.readUInt8() ) !== common.TYPE_CLOSE ) {
		set.add( await unserializeAnyType( runtime , type ) ) ;
	}

	return set ;
}



async function unserializeStrictObject( runtime ) {
	var object = {} ;
	runtime.refs[ runtime.refCount ++ ] = object ;
	await unserializeKV( runtime , object ) ;
	return object ;
}



async function unserializeMap( runtime ) {
	var map = new Map() ;
	runtime.refs[ runtime.refCount ++ ] = map ;
	await unserializeMapKV( runtime , map ) ;
	return map ;
}



async function unserializeInstance( runtime , emptyInstance ) {
	var type , className , classData , object ;

	type = await runtime.streamBuffer.readUInt8() ;

	if ( type & common.STRING_MASK !== common.STRING_MASK ) {
		throw new Error( 'unserializeInstance(): Bad class name - not a string' ) ;
	}

	className = await unserializeAnyType( runtime , type ) ;

	if ( ! runtime.classMap || ! ( classData = runtime.classMap.classes[ className ] ) || ! classData.prototype ) {
		if ( runtime.enableUnknown ) {
			classData = Unknown ;
		}
		else {
			throw new Error( "unserializeInstance(): Cannot unserialize instances - class or prototype '" + className + "' not found in classMap" ) ;
		}
	}

	object = Object.create( classData.prototype ) ;

	if ( classData === Unknown ) {
		object.__className__ = className ;
	}

	runtime.refs[ runtime.refCount ++ ] = object ;

	if ( ! emptyInstance ) {
		await unserializeKV( runtime , object ) ;
	}

	return object ;
}



async function unserializeConstructedInstance( runtime ) {
	var type , className , classData , constructorFn , useNew , object , args ,
		instanceId = runtime.refCount ++ ;

	type = await runtime.streamBuffer.readUInt8() ;

	if ( type & common.STRING_MASK !== common.STRING_MASK ) {
		throw new Error( 'unserializeConstructedInstance(): Bad class name - not a string' ) ;
	}

	className = await unserializeAnyType( runtime , type ) ;

	if ( ! runtime.classMap || ! ( classData = runtime.classMap.classes[ className ] ) || ! classData.prototype ) {
		if ( runtime.enableUnknown ) {
			classData = Unknown ;
		}
		else {
			throw new Error( "unserializeConstructedInstance(): Cannot unserialize instances - class or prototype '" + className + "' not found in classMap" ) ;
		}
	}

	if ( typeof classData.unserializer === 'function' ) {
		constructorFn = classData.unserializer ;
		useNew = classData.useNew !== undefined ? !! classData.useNew : false ;
	}
	else if ( typeof classData === 'function' ) {
		constructorFn = classData ;
		useNew = classData.useNew !== undefined ? !! classData.useNew : true ;
	}
	else {
		throw new Error( "unserializeConstructedInstance(): No constructor" ) ;
	}

	type = await runtime.streamBuffer.readUInt8() ;
	args = await unserializeAnyType( runtime , type ) ;
	//console.log( "Got args:" , args ) ;

	if ( ! Array.isArray( args ) ) {
		args = [ args ] ;
	}

	if ( useNew ) {
		//console.log( "@@@ With new" ) ;
		object = new constructorFn( ... args ) ;
	}
	else {
		//console.log( "@@@ Without new" ) ;
		object = constructorFn( ... args ) ;
	}

	if ( classData === Unknown ) {
		object.__className__ = className ;
	}

	runtime.refs[ instanceId ] = object ;

	await unserializeKV( runtime , object ) ;

	return object ;
}



async function unserializeKV( runtime , object ) {
	var type , key , value ;

	while ( ( type = await runtime.streamBuffer.readUInt8() ) !== common.TYPE_CLOSE ) {
		if ( type & common.STRING_MASK !== common.STRING_MASK ) {
			throw new Error( 'unserializeKV(): Bad key - not a string' ) ;
		}

		key = await unserializeAnyType( runtime , type ) ;

		type = await runtime.streamBuffer.readUInt8() ;

		if ( type === common.TYPE_CLOSE ) {
			throw new Error( 'unserializeKV(): Closing object after key/before value' ) ;
		}

		value = await unserializeAnyType( runtime , type ) ;

		//console.log( "KV:" , key , value ) ;
		object[ key ] = value ;
	}
}



async function unserializeMapKV( runtime , map ) {
	var type , key , value ;

	while ( ( type = await runtime.streamBuffer.readUInt8() ) !== common.TYPE_CLOSE ) {
		key = await unserializeAnyType( runtime , type ) ;

		type = await runtime.streamBuffer.readUInt8() ;

		if ( type === common.TYPE_CLOSE ) {
			throw new Error( 'unserializeMapKV(): Closing map after key/before value' ) ;
		}

		value = await unserializeAnyType( runtime , type ) ;

		//console.log( "KV:" , key , value ) ;
		map.set( key , value ) ;
	}
}



async function unserializeBuffer( runtime ) {
	var size = await runtime.streamBuffer.readUInt32() ;
	var buffer = await runtime.streamBuffer.read( size ) ;
	runtime.refs[ runtime.refCount ++ ] = buffer ;
	return buffer ;
}



async function unserializeRef( runtime ) {
	var index = await runtime.streamBuffer.readUInt32() ;

	if ( index >= runtime.refs.length ) {
		throw new Error( "unserializeRef(): Bad ref - index out of range" ) ;
	}

	return runtime.refs[ index ] ;
}

