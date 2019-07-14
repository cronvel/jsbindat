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



const ClassMap = require( './ClassMap.js' ) ;
const Unknown = require( './Unknown.js' ) ;
const common = require( './strCommon.js' ) ;



function unserialize( str , options , context ) {
	options = options || {} ;
	var classMap = options.classMap ;
	if ( classMap && ! ( classMap instanceof ClassMap ) ) { classMap = new ClassMap( classMap ) ; }

	var runtime = {
		str: str ,
		i: 0 ,
		universal: options.universal ,
		classMap: classMap ,
		context: context ,
		enableUnknown: options.enableUnknown ,
		refCount: 0 ,
		refs: []
	} ;

	return unserializeData( runtime ) ;
}



module.exports = unserialize ;



function unserializeData( runtime ) {
	runtime.refCount = 0 ;
	runtime.refs.length = 0 ;
	return unserializeAnyType( runtime ) ;
}



function unserializeAnyType( runtime ) {
	var object ,
		type = runtime.str[ runtime.i ] ;

	runtime.i ++ ;

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
			return unserializeNumber( runtime ) ;

			// Strings

		case common.TYPE_EMPTY_STRING :
			return '' ;
		case common.TYPE_STRING_LPS :
			return unserializeStringLps( runtime ) ;

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
		case common.TYPE_INSTANCE :
			return unserializeInstance( runtime ) ;
		case common.TYPE_CONSTRUCTED_INSTANCE :
			return unserializeConstructedInstance( runtime ) ;
		case common.TYPE_PROTOTYPED_OBJECT :
			return unserializePrototypedObject( runtime ) ;

			// Buffers

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
			throw new Error( "Not supported yet: '" + type + "'" ) ;
	}
}



function unserializeNumber( runtime ) {
	var n ,
		i = runtime.i ,
		iMax = Math.min( runtime.str.length , i + 30 ) ;

	while ( runtime.str[ i ] !== common.TYPE_SEPARATOR && i < iMax ) { i ++ ; }

	if ( i === iMax ) { throw new Error( 'Bad number: separator not found' ) ; }

	n = parseFloat( runtime.str.slice( runtime.i , i ) ) ;
	runtime.i = i + 1 ;

	return n ;
}



function unserializeStringLps( runtime ) {
	var length = unserializeNumber( runtime ) ,
		str = runtime.str.slice( runtime.i , runtime.i + length ) ;

	if ( str.length !== length ) { throw new Error( 'Bad string: bad length' ) ; }

	runtime.i += str.length ;
	if ( runtime.str[ runtime.i ] !== common.TYPE_SEPARATOR ) { throw new Error( 'Bad string: separator not found' ) ; }

	runtime.i ++ ;

	return str ;
}



function unserializeArray( runtime ) {
	if ( runtime.str[ runtime.i ] !== common.TYPE_OPEN ) { throw new Error( 'Bad Array: open not found' ) ; }

	var array = [] ;

	runtime.i ++ ;
	runtime.refs[ runtime.refCount ++ ] = array ;

	while ( runtime.str[ runtime.i ] !== common.TYPE_CLOSE ) {
		array.push( unserializeAnyType( runtime ) ) ;
	}

	runtime.i ++ ;

	return array ;
}



function unserializeSet( runtime ) {
	if ( runtime.str[ runtime.i ] !== common.TYPE_OPEN ) { throw new Error( 'Bad Set: open not found' ) ; }

	var type , set_ = new Set() ;

	runtime.i ++ ;
	runtime.refs[ runtime.refCount ++ ] = set_ ;

	while ( runtime.str[ runtime.i ] !== common.TYPE_CLOSE ) {
		set_.add( unserializeAnyType( runtime , type ) ) ;
	}

	runtime.i ++ ;

	return set_ ;
}



function unserializeStrictObject( runtime ) {
	if ( runtime.str[ runtime.i ] !== common.TYPE_OPEN ) { throw new Error( 'Bad Object: open not found' ) ; }

	var object = {} ;

	runtime.i ++ ;
	runtime.refs[ runtime.refCount ++ ] = object ;

	unserializeKV( runtime , object ) ;

	runtime.i ++ ;

	return object ;
}



function unserializePrototypedObject( runtime ) {
	if ( runtime.str[ runtime.i ] !== common.TYPE_OPEN ) { throw new Error( 'Bad Prototyped Object: open not found' ) ; }

	runtime.i ++ ;

	var prototype = unserializeAnyType( runtime ) ,
		object = Object.create( prototype ) ;

	runtime.refs[ runtime.refCount ++ ] = object ;

	unserializeKV( runtime , object ) ;

	runtime.i ++ ;

	return object ;
}



function unserializeMap( runtime ) {
	if ( runtime.str[ runtime.i ] !== common.TYPE_OPEN ) { throw new Error( 'Bad Map: open not found' ) ; }

	var map = new Map() ;

	runtime.i ++ ;
	runtime.refs[ runtime.refCount ++ ] = map ;

	unserializeMapKV( runtime , map ) ;

	runtime.i ++ ;

	return map ;
}



function unserializeInstance( runtime ) {
	if ( runtime.str[ runtime.i ] !== common.TYPE_OPEN ) { throw new Error( 'Bad Instance: open not found' ) ; }

	var className , classData , object ;

	runtime.i ++ ;

	if ( runtime.str[ runtime.i ] !== common.TYPE_STRING_LPS ) {
		throw new Error( 'unserializeInstance(): Bad class name - not a string' ) ;
	}

	runtime.i ++ ;
	className = unserializeStringLps( runtime ) ;

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

	unserializeKV( runtime , object ) ;

	runtime.i ++ ;

	return object ;
}



function unserializeConstructedInstance( runtime ) {
	if ( runtime.str[ runtime.i ] !== common.TYPE_OPEN ) { throw new Error( 'Bad Instance: open not found' ) ; }

	var className , classData , constructorFn , useNew , object , args ,
		instanceId = runtime.refCount ++ ;

	runtime.i ++ ;

	if ( runtime.str[ runtime.i ] !== common.TYPE_STRING_LPS ) {
		throw new Error( 'unserializeConstructedInstance(): Bad class name - not a string' ) ;
	}

	runtime.i ++ ;

	className = unserializeStringLps( runtime ) ;

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

	args = unserializeAnyType( runtime ) ;
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

	// Some class require some final operation *AFTER* overide
	if ( classData.unserializeFinalizer ) {
		//classData.unserializeFinalizer( object ) ;
		classData.unserializeFinalizer( object , runtime.context , className ) ;
	}

	runtime.i ++ ;

	return object ;
}



function unserializeKV( runtime , object ) {
	var type , key , value ;

	while ( ( type = runtime.str[ runtime.i ] ) !== common.TYPE_CLOSE ) {
		if ( type !== common.TYPE_STRING_LPS ) {
			throw new Error( 'unserializeKV(): Bad key - not a string' ) ;
		}

		runtime.i ++ ;
		key = unserializeStringLps( runtime ) ;

		type = runtime.str[ runtime.i ] ;

		if ( type === common.TYPE_CLOSE ) {
			throw new Error( 'unserializeKV(): Closing object after key/before value' ) ;
		}

		value = unserializeAnyType( runtime ) ;

		//console.log( "KV:" , key , value ) ;
		object[ key ] = value ;
	}
}



function unserializeMapKV( runtime , map ) {
	var type , key , value ;

	while ( ( type = runtime.str[ runtime.i ] ) !== common.TYPE_CLOSE ) {
		key = unserializeAnyType( runtime ) ;

		type = runtime.str[ runtime.i ] ;

		if ( type === common.TYPE_CLOSE ) {
			throw new Error( 'unserializeMapKV(): Closing map after key/before value' ) ;
		}

		value = unserializeAnyType( runtime ) ;

		//console.log( "KV:" , key , value ) ;
		map.set( key , value ) ;
	}
}



function unserializeBuffer( runtime ) {
	var str = unserializeStringLps( runtime ) ,
		buffer = Buffer.from( str , 'base64' ) ;

	return buffer ;
}



function unserializeRef( runtime ) {
	var index = unserializeNumber( runtime ) ;

	if ( index >= runtime.refs.length ) {
		throw new Error( "unserializeRef(): Bad ref - index out of range" ) ;
	}

	return runtime.refs[ index ] ;
}

