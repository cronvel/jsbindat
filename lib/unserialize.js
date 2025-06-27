/*
	JS Binary Data

	Copyright (c) 2016 - 2025 Cédric Ronvel

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



function unserialize( buffer , params , context ) {
	params = params || {} ;
	var classMap = params.classMap ;
	if ( classMap && ! ( classMap instanceof ClassMap ) ) { classMap = new ClassMap( classMap ) ; }

	var runtime = {
		magicNumber: params.magicNumber || '' , // Magic number format, it will be 0x1b + STRING (latin1) + 0x00
		srBuffer: new SequentialReadBuffer( buffer ) ,
		universal: params.universal ,
		model: params.model ,
		classMap: classMap ,
		context: context ,
		enableUnknown: !! params.enableUnknown ,
		enableFunction: !! params.enableFunction ,
		headers: null ,
		refCount: 0 ,
		refs: [] ,
		stringRefs: []
	} ;

	if ( params.initialStringReferences && Array.isArray( params.initialStringReferences ) ) {
		for ( let stringRef of params.initialStringReferences ) {
			runtime.stringRefs.push( stringRef ) ;
		}
	}

	var nextType = unserializeHeader( runtime ) ;

	if ( params.model ) { return unserializeRootModel( runtime , nextType ) ; }
	return unserializeAnyType( runtime , nextType ) ;
}



module.exports = unserialize ;



function unserializeHeader( runtime ) {
	var type , first = true ;

	runtime.headers = {
		initialStringRefCount: 0 ,
		magicNumber: ''
	} ;

	while ( ( ( type = runtime.srBuffer.readUInt8() ) & common.HEADER_MASK_SELECTION ) === common.HEADER_MASK_VALUE ) {
		//console.log( ">>> Got header: 0x" + type.toString( 16 ).padStart( 2 , '0' ) ) ;
		switch ( type ) {
			case common.TYPE_MAGIC_NUMBER :
				if ( ! first ) {
					throw new Error( "unserializeHeader(): expecting magic number to be the first header" ) ;
				}
				runtime.headers.magicNumber = runtime.srBuffer.readNullTerminatedString() ;
				//console.log( "Got magic number:" , runtime.headers.magicNumber ) ;
				break ;
			case common.TYPE_INITIAL_STRING_REF_COUNT :
				runtime.headers.initialStringRefCount = runtime.srBuffer.readUInt32() ;
				break ;
		}

		first = false ;
	}

	if ( runtime.headers.magicNumber !== runtime.magicNumber ) {
		throw new Error( "unserializeHeader(): expecting magic number to be '" + runtime.magicNumber + "' but got '" + runtime.headers.magicNumber + "'." ) ;
	}

	if ( runtime.headers.initialStringRefCount !== runtime.stringRefs.length ) {
		throw new Error( "unserializeHeader(): expecting initial string ref count to be " + runtime.stringRefs.length + " but got " + runtime.headers.initialStringRefCount + "." ) ;
	}

	return type ;
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
		case common.TYPE_STORED_STRING_LPS8_UTF8 : {
			let string = runtime.srBuffer.readLps8Utf8() ;
			runtime.stringRefs.push( string ) ;
			return string ;
		}
		case common.TYPE_STORED_STRING_LPS16_UTF8 : {
			let string = runtime.srBuffer.readLps16Utf8() ;
			runtime.stringRefs.push( string ) ;
			return string ;
		}
		case common.TYPE_STORED_STRING_LPS32_UTF8 : {
			let string = runtime.srBuffer.readLps32Utf8() ;
			runtime.stringRefs.push( string ) ;
			return string ;
		}
		case common.TYPE_STRING_REF16 :
			return unserializeStringRef16( runtime ) ;
		case common.TYPE_STRING_REF32 :
			return unserializeStringRef32( runtime ) ;

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
		case common.TYPE_INSTANCE_DATA_MODEL :
			return unserializeInstance( runtime , false , true ) ;
		case common.TYPE_CONSTRUCTED_INSTANCE :
			return unserializeConstructedInstance( runtime ) ;
		case common.TYPE_CONSTRUCTED_INSTANCE_DATA_MODEL :
			return unserializeConstructedInstance( runtime , true ) ;
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
			throw new Error( "Type not supported: 0x" + type.toString( 16 ).padStart( 2 , '0' ) ) ;
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
		//console.log( "Type: 0x" + type.toString( 16 ).padStart( 2 , '0' ) ) ;
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



function unserializeInstance( runtime , emptyInstance , useDataModel ) {
	var type , className , classData , object ;

	type = runtime.srBuffer.readUInt8() ;

	if ( ( type & common.STRING_MASK_SELECTION ) !== common.STRING_MASK_VALUE ) {
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
		if ( useDataModel ) {
			if ( classData.model ) {
				unserializeKVModel( runtime , object , classData.model ) ;
			}
			else {
				throw new Error( "unserializeInstance(): Cannot unserialize instances - Data Model for class or prototype '" + className + "' not found" ) ;
			}
		}
		else {
			unserializeKV( runtime , object ) ;
		}
	}

	return object ;
}



const EMPTY_ARRAY = [] ;

function unserializeConstructedInstance( runtime , useDataModel ) {
	var type , className , classData , constructorFn , useNew , object , args ,
		instanceId = runtime.refCount ++ ;

	type = runtime.srBuffer.readUInt8() ;

	if ( ( type & common.STRING_MASK_SELECTION ) !== common.STRING_MASK_VALUE ) {
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

	if ( useDataModel && classData.argumentsModel ) {
		args = unserializeAnyModel( runtime , classData.argumentsModel ) ;
	}
	else {
		type = runtime.srBuffer.readUInt8() ;
		args = unserializeAnyType( runtime , type ) ;
	}

	//console.log( "Got args:" , args ) ;

	if ( ! Array.isArray( args ) ) {
		if ( args === null ) { args = EMPTY_ARRAY ; }	// Backward compatibility
		else { throw new Error( "unserializeConstructedInstance(): constructor arguments should be an array or null" ) ; }
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

	if ( useDataModel && classData.overrideModel ) {
		unserializeKVModel( runtime , object , classData.overrideModel ) ;
	}
	else {
		unserializeKV( runtime , object ) ;
	}

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
		if ( ( type & common.STRING_MASK_SELECTION ) !== common.STRING_MASK_VALUE ) {
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



function unserializeStringRef16( runtime ) {
	var index = runtime.srBuffer.readInt16() ;

	if ( index >= runtime.stringRefs.length ) {
		throw new Error( "unserializeStringRef16(): Bad ref - index out of range" ) ;
	}

	return runtime.stringRefs[ index ] ;
}



function unserializeStringRef32( runtime ) {
	var index = runtime.srBuffer.readInt32() ;

	if ( index >= runtime.stringRefs.length ) {
		throw new Error( "unserializeStringRef32(): Bad ref - index out of range" ) ;
	}

	return runtime.stringRefs[ index ] ;
}



// Models

function unserializeRootModel( runtime , type ) {
	if ( type !== common.TYPE_ROOT_DATA_MODEL ) {
		throw new Error( "unserializeRootModel() expecting a Root Data Model type, but got: 0x" + type.toString( 16 ).padStart( 2 , '0' ) ) ;
	}

	return unserializeAnyModel( runtime , runtime.model ) ;
}



function unserializeAnyModel( runtime , model ) {
	if ( model.isArray ) {
		if ( model.fixedLength ) { return unserializeFixedTypedArrayModel( runtime , model ) ; }
		return unserializeTypedArrayModel( runtime , model ) ;
	}

	return unserializeSealedObjectModel( runtime , model ) ;
}



const READERS = {
	number: 'readNumber' ,		// For instance, it's the same than float64
	boolean: 'readBoolean' ,
	float32: 'readFloat' ,
	float64: 'readDouble' ,
	uint8: 'readUInt8' ,
	int8: 'readInt8' ,
	uint16: 'readUInt16' ,
	int16: 'readInt16' ,
	uint32: 'readUInt32' ,
	int32: 'readInt32' ,
	lps8string: 'readLps8Utf8' ,
	lps16string: 'readLps16Utf8' ,
	lps32string: 'readLps32Utf8'
} ;



function unserializeTypedArrayModel( runtime , model ) {
	var type = model.ofType ;
	var length = runtime.srBuffer.readUInt32() ;
	var array = new Array( length ) ;

	if ( type === 'any' ) {
		for ( let i = 0 ; i < length ; i ++ ) {
			let subType = runtime.srBuffer.readUInt8() ;
			array[ i ] = unserializeAnyType( runtime , subType ) ;
		}
	}
	else if ( type.isDataModel ) {
		for ( let i = 0 ; i < length ; i ++ ) {
			array[ i ] = unserializeAnyModel( runtime , type ) ;
		}
	}
	else {
		let methodName = READERS[ type ] ;

		for ( let i = 0 ; i < length ; i ++ ) {
			array[ i ] = runtime.srBuffer[ methodName ]() ;
		}
	}

	return array ;
}



function unserializeFixedTypedArrayModel( runtime , model ) {
	var type = model.ofType ;
	var array = new Array( model.length ) ;

	if ( type === 'any' ) {
		for ( let i = 0 ; i < model.length ; i ++ ) {
			let subType = runtime.srBuffer.readUInt8() ;
			array[ i ] = unserializeAnyType( runtime , subType ) ;
		}
	}
	else if ( type.isDataModel ) {
		for ( let i = 0 ; i < model.length ; i ++ ) {
			array[ i ] = unserializeAnyModel( runtime , type ) ;
		}
	}
	else {
		let methodName = READERS[ type ] ;

		for ( let i = 0 ; i < model.length ; i ++ ) {
			array[ i ] = runtime.srBuffer[ methodName ]() ;
		}
	}

	return array ;
}



function unserializeSealedObjectModel( runtime , model ) {
	var object = {} ;
	unserializeKVModel( runtime , object , model ) ;
	return object ;
}



function unserializeKVModel( runtime , object , model ) {
	for ( let [ key , type ] of model.keyTypePairs ) {
		if ( type === 'any' ) {
			let subType = runtime.srBuffer.readUInt8() ;
			object[ key ] = unserializeAnyType( runtime , subType ) ;
		}
		else if ( type.isDataModel ) {
			object[ key ] = unserializeAnyModel( runtime , type ) ;
		}
		else {
			object[ key ] = runtime.srBuffer[ READERS[ type ] ]() ;
		}
	}
}

