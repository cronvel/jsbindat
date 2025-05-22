/*
	JS Binary Data

	Copyright (c) 2016 - 2021 Cédric Ronvel

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



const SequentialReadBuffer = require( 'stream-kit/lib/SequentialReadBuffer.js' ) ;
const ClassMap = require( './ClassMap.js' ) ;
const Unknown = require( './Unknown.js' ) ;
const common = require( './common.js' ) ;



function unserialize( buffer , options , context ) {
	options = options || {} ;
	var classMap = options.classMap ;
	if ( classMap && ! ( classMap instanceof ClassMap ) ) { classMap = new ClassMap( classMap ) ; }

	var runtime = {
		srBuffer: new SequentialReadBuffer( buffer ) ,
		universal: options.universal ,
		classMap: classMap ,
		context: context ,
		enableUnknown: !! options.enableUnknown ,
		enableFunction: !! options.enableFunction ,
		refCount: 0 ,
		refs: []
	} ;

	return unserializeData( runtime ) ;
}



module.exports = unserialize ;



function unserializeData( runtime ) {
	runtime.refCount = 0 ;
	runtime.refs.length = 0 ;

	var type = runtime.srBuffer.readUInt8() ;

	return unserializeAnyType( runtime , type ) ;
}



function unserializeAnyType( runtime , type ) {
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

		// Prototype constants
		case common.TYPE_OBJECT_PROTOTYPE :
			return Object.prototype ;

			// Numbers

		case common.TYPE_NUMBER :
			return runtime.srBuffer.readNumber() ;
		case common.TYPE_UINT8 :
			return runtime.srBuffer.readUInt8() ;
		case common.TYPE_UINT16 :
			return runtime.srBuffer.readUInt16() ;
		case common.TYPE_UINT32 :
			return runtime.srBuffer.readUInt32() ;
		case common.TYPE_INT8 :
			return runtime.srBuffer.readInt8() ;
		case common.TYPE_INT16 :
			return runtime.srBuffer.readInt16() ;
		case common.TYPE_INT32 :
			return runtime.srBuffer.readInt32() ;

			// Strings

		case common.TYPE_EMPTY_STRING :
			return '' ;
		case common.TYPE_STRING_LPS8_UTF8 :
			return runtime.srBuffer.readLps8Utf8() ;
		case common.TYPE_STRING_LPS16_UTF8 :
			return runtime.srBuffer.readLps16Utf8() ;
		case common.TYPE_STRING_LPS32_UTF8 :
			return runtime.srBuffer.readLps32Utf8() ;

			// Arrays and the like

		case common.TYPE_EMPTY_ARRAY :
			object = [] ;
			runtime.refs[ runtime.refCount ++ ] = object ;
			return object ;
		case common.TYPE_ARRAY :
			return unserializeArray( runtime ) ;
		case common.TYPE_EMPTY_SET :
			object = new Set() ;
			runtime.refs[ runtime.refCount ++ ] = object ;
			return object ;
		case common.TYPE_SET :
			return unserializeSet( runtime ) ;

			// Objects and the like

		case common.TYPE_EMPTY_OBJECT :
			object = {} ;
			runtime.refs[ runtime.refCount ++ ] = object ;
			return object ;
		case common.TYPE_OBJECT :
			return unserializeStrictObject( runtime ) ;
		case common.TYPE_EMPTY_MAP :
			object = new Map() ;
			runtime.refs[ runtime.refCount ++ ] = object ;
			return object ;
		case common.TYPE_MAP :
			return unserializeMap( runtime ) ;
		case common.TYPE_EMPTY_INSTANCE :
			return unserializeInstance( runtime , true ) ;
		case common.TYPE_INSTANCE :
			return unserializeInstance( runtime ) ;
		case common.TYPE_CONSTRUCTED_INSTANCE :
			return unserializeConstructedInstance( runtime ) ;
		case common.TYPE_PROTOTYPED_OBJECT :
			return unserializePrototypedObject( runtime ) ;

			// Built-in Objects (Date, Buffers, ...)

		case common.TYPE_FUNCTION :
			return unserializeFunction( runtime ) ;

			// Built-in Objects (Date, Buffers, ...)

		case common.TYPE_DATE :
			return unserializeDate( runtime ) ;
		case common.TYPE_BUFFER :
			return unserializeBuffer( runtime ) ;

			// Misc

		case common.TYPE_REF :
			return unserializeRef( runtime ) ;
		case common.TYPE_UNSUPPORTED :
			return undefined ;
		case common.TYPE_CLOSE :
			throw new Error( "Unexpected close" ) ;
		default :
			throw new Error( "Not supported yet: 0x" + type.toString( 16 ) ) ;
	}
}



function unserializeFunction( runtime ) {
	var type , str ;

	type = runtime.srBuffer.readUInt8() ;
	str = unserializeAnyType( runtime , type ) ;

	type = runtime.srBuffer.readUInt8() ;

	if ( type !== common.TYPE_CLOSE ) {
		throw new Error( 'unserializeFunction(): Missing close' ) ;
	}

	if ( ! runtime.enableFunction ) { return ; }

	// new Function need the body of a function, and argument beforehand...
	// So this trick creates a function returning our serialized function declaration and execute it right away.
	return new Function( 'return ( ' + str + ' ) ;' )() ;
}



function unserializeArray( runtime ) {
	var type , array = [] ;

	runtime.refs[ runtime.refCount ++ ] = array ;

	while ( ( type = runtime.srBuffer.readUInt8() ) !== common.TYPE_CLOSE ) {
		//console.log( "Type: 0x" + type.toString( 16 ) ) ;
		array.push( unserializeAnyType( runtime , type ) ) ;
	}

	return array ;
}



function unserializeSet( runtime ) {
	var type , set_ = new Set() ;

	runtime.refs[ runtime.refCount ++ ] = set_ ;

	while ( ( type = runtime.srBuffer.readUInt8() ) !== common.TYPE_CLOSE ) {
		set_.add( unserializeAnyType( runtime , type ) ) ;
	}

	return set_ ;
}



function unserializeStrictObject( runtime ) {
	var object = {} ;
	runtime.refs[ runtime.refCount ++ ] = object ;
	unserializeKV( runtime , object ) ;
	return object ;
}



function unserializePrototypedObject( runtime ) {
	var type = runtime.srBuffer.readUInt8() ;
	var prototype = unserializeAnyType( runtime , type ) ;
	var object = Object.create( prototype ) ;
	runtime.refs[ runtime.refCount ++ ] = object ;
	unserializeKV( runtime , object ) ;
	return object ;
}



function unserializeMap( runtime ) {
	var map = new Map() ;
	runtime.refs[ runtime.refCount ++ ] = map ;
	unserializeMapKV( runtime , map ) ;
	return map ;
}



function unserializeInstance( runtime , emptyInstance ) {
	var type , className , classData , object ;

	type = runtime.srBuffer.readUInt8() ;

	if ( type & common.STRING_MASK !== common.STRING_MASK ) {
		throw new Error( 'unserializeInstance(): Bad class name - not a string' ) ;
	}

	className = unserializeAnyType( runtime , type ) ;

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
		unserializeKV( runtime , object ) ;
	}

	return object ;
}



function unserializeConstructedInstance( runtime ) {
	var type , className , classData , constructorFn , useNew , object , args ,
		instanceId = runtime.refCount ++ ;

	type = runtime.srBuffer.readUInt8() ;

	if ( type & common.STRING_MASK !== common.STRING_MASK ) {
		throw new Error( 'unserializeConstructedInstance(): Bad class name - not a string' ) ;
	}

	className = unserializeAnyType( runtime , type ) ;

	if ( ! runtime.classMap || ! ( classData = runtime.classMap.classes[ className ] ) || ! classData.prototype ) {
		if ( runtime.universal ) {
			classData = runtime.universal ;
		}
		else if ( runtime.enableUnknown ) {
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

	type = runtime.srBuffer.readUInt8() ;
	args = unserializeAnyType( runtime , type ) ;
	//console.log( "Got args:" , args ) ;

	if ( ! Array.isArray( args ) ) {
		args = [] ;
	}

	if ( classData.unserializeClassName ) {
		args.unshift( className ) ;
	}

	if ( classData.unserializeContext ) {
		args.unshift( runtime.context ) ;
	}

	if ( useNew ) {
		//console.log( "@@@ With new" ) ;
		object = new constructorFn( ... args ) ;
	}
	else {
		//console.log( "@@@ Without new" ) ;
		object = constructorFn( ... args ) ;
	}

	runtime.refs[ instanceId ] = object ;

	unserializeKV( runtime , object ) ;

	// Some class require some final operation *AFTER* override
	if ( classData.unserializeFinalizer ) {
		//classData.unserializeFinalizer( object ) ;
		classData.unserializeFinalizer( object , runtime.context , className ) ;
	}

	return object ;
}



function unserializeKV( runtime , object ) {
	var type , key , value ;

	while ( ( type = runtime.srBuffer.readUInt8() ) !== common.TYPE_CLOSE ) {
		if ( type & common.STRING_MASK !== common.STRING_MASK ) {
			throw new Error( 'unserializeKV(): Bad key - not a string' ) ;
		}

		key = unserializeAnyType( runtime , type ) ;

		type = runtime.srBuffer.readUInt8() ;

		if ( type === common.TYPE_CLOSE ) {
			throw new Error( 'unserializeKV(): Closing object after key/before value' ) ;
		}

		value = unserializeAnyType( runtime , type ) ;

		//console.log( "KV:" , key , value ) ;
		object[ key ] = value ;
	}
}



function unserializeMapKV( runtime , map ) {
	var type , key , value ;

	while ( ( type = runtime.srBuffer.readUInt8() ) !== common.TYPE_CLOSE ) {
		key = unserializeAnyType( runtime , type ) ;

		type = runtime.srBuffer.readUInt8() ;

		if ( type === common.TYPE_CLOSE ) {
			throw new Error( 'unserializeMapKV(): Closing map after key/before value' ) ;
		}

		value = unserializeAnyType( runtime , type ) ;

		//console.log( "KV:" , key , value ) ;
		map.set( key , value ) ;
	}
}



function unserializeDate( runtime ) {
	var date = new Date( runtime.srBuffer.readNumber() ) ;
	runtime.refs[ runtime.refCount ++ ] = date ;
	return date ;
}



function unserializeBuffer( runtime ) {
	var size = runtime.srBuffer.readUInt32() ;
	var buffer = runtime.srBuffer.readBuffer( size ) ;
	runtime.refs[ runtime.refCount ++ ] = buffer ;
	return buffer ;
}



function unserializeRef( runtime ) {
	var index = runtime.srBuffer.readUInt32() ;

	if ( index >= runtime.refs.length ) {
		throw new Error( "unserializeRef(): Bad ref - index out of range" ) ;
	}

	return runtime.refs[ index ] ;
}

