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



const SequentialWriteBuffer = require( 'stream-kit/lib/SequentialWriteBuffer.js' ) ;
const ClassMap = require( './ClassMap.js' ) ;
const common = require( './common.js' ) ;

//function noop() {}



function serialize( v , params ) {
	params = params || {} ;
	var classMap = params.classMap ;
	if ( classMap && ! ( classMap instanceof ClassMap ) ) { classMap = new ClassMap( classMap ) ; }

	var runtime = {
		magicNumber: params.magicNumber || '' ,	// Magic number format, it will be 0x1b + STRING (latin1) + 0x00
		swBuffer: new SequentialWriteBuffer( params ) ,
		universal: params.universal ,
		model: params.model ,	// root model
		classMap: classMap ,
		autoInstance: params.autoInstance ,
		prototypeChain: params.prototypeChain ,
		refCount: 0	,
		refs: new WeakMap() ,
		referenceStrings: !! params.referenceStrings ,
		referenceKeyStrings: !! params.referenceKeyStrings ,
		referenceClassNameStrings: !! params.referenceClassNameStrings ,
		stringRefCount: 0	,
		stringRefs: new Map()
	} ;

	if ( params.initialStringReferences && Array.isArray( params.initialStringReferences ) ) {
		for ( let stringRef of params.initialStringReferences ) {
			runtime.stringRefs.set( stringRef , runtime.stringRefCount ) ;
			runtime.stringRefCount ++ ;
		}
	}

	serializeHeader( runtime ) ;

	if ( runtime.model ) { serializeRootModel( v , runtime ) ; }
	else { serializeAnyType( v , runtime ) ; }

	return runtime.swBuffer.getBuffer( true ) ;
}



module.exports = serialize ;



function serializeHeader( runtime ) {
	if ( runtime.magicNumber ) {
		runtime.swBuffer.writeUInt8( common.TYPE_MAGIC_NUMBER ) ;
		runtime.swBuffer.writeNullTerminatedString( runtime.magicNumber ) ;	// Not utf8 but latin1
	}

	if ( runtime.stringRefCount ) {
		runtime.swBuffer.writeUInt8( common.TYPE_INITIAL_STRING_REF_COUNT ) ;
		runtime.swBuffer.writeUInt32( runtime.stringRefCount ) ;
	}
}



function serializeAnyType( v , runtime ) {
	switch ( v ) {
		case undefined :
			runtime.swBuffer.writeUInt8( common.TYPE_UNDEFINED ) ;
			return ;
		case null :
			runtime.swBuffer.writeUInt8( common.TYPE_NULL ) ;
			return ;
		case true :
			runtime.swBuffer.writeUInt8( common.TYPE_TRUE ) ;
			return ;
		case false :
			runtime.swBuffer.writeUInt8( common.TYPE_FALSE ) ;
			return ;

		// Prototype constants
		case Object.prototype :
			runtime.swBuffer.writeUInt8( common.TYPE_OBJECT_PROTOTYPE ) ;
			return ;
	}

	switch ( typeof v ) {
		case 'number' :
			serializeNumber( v , runtime ) ;
			return ;
		case 'string' :
			serializeString( v , runtime , VALUE_STRING ) ;
			return ;
		case 'object' :
			serializeAnyObject( v , runtime ) ;
			return ;
		case 'function' :
			serializeFunction( v , runtime ) ;
			return ;
	}

	// Unsupported data
	runtime.swBuffer.writeUInt8( common.TYPE_UNSUPPORTED ) ;
}



function serializeNumber( v , runtime ) {
	// We could store anything in the "number" type, but this way it takes more space than JSON (8 bytes per number).
	// Instead, we try to detect if a number is an integer to use the appropriate binary type.

	if ( v === 0 ) {
		runtime.swBuffer.writeUInt8( common.TYPE_ZERO ) ;
	}
	else if ( v === 1 ) {
		runtime.swBuffer.writeUInt8( common.TYPE_ONE ) ;
	}
	else if ( ! isFinite( v ) || v !== Math.round( v ) ) {
		// Floating point number
		runtime.swBuffer.writeUInt8( common.TYPE_NUMBER ) ;
		runtime.swBuffer.writeNumber( v ) ;
	}
	else if ( v >= 0 ) {
		if ( v <= 255 ) {
			runtime.swBuffer.writeUInt8( common.TYPE_UINT8 ) ;
			runtime.swBuffer.writeUInt8( v ) ;
		}
		else if ( v <= 65535 ) {
			runtime.swBuffer.writeUInt8( common.TYPE_UINT16 ) ;
			runtime.swBuffer.writeUInt16( v ) ;
		}
		else if ( v <= 4294967295 ) {
			runtime.swBuffer.writeUInt8( common.TYPE_UINT32 ) ;
			runtime.swBuffer.writeUInt32( v ) ;
		}
		else {
			runtime.swBuffer.writeUInt8( common.TYPE_NUMBER ) ;
			runtime.swBuffer.writeNumber( v ) ;
		}
	}
	else if ( v >= -128 ) {
		runtime.swBuffer.writeUInt8( common.TYPE_INT8 ) ;
		runtime.swBuffer.writeInt8( v ) ;
	}
	else if ( v >= -32768 ) {
		runtime.swBuffer.writeUInt8( common.TYPE_INT16 ) ;
		runtime.swBuffer.writeInt16( v ) ;
	}
	else if ( v >= -2147483648 ) {
		runtime.swBuffer.writeUInt8( common.TYPE_INT32 ) ;
		runtime.swBuffer.writeInt32( v ) ;
	}
	else {
		runtime.swBuffer.writeUInt8( common.TYPE_NUMBER ) ;
		runtime.swBuffer.writeNumber( v ) ;
	}
}



// Type of string
const VALUE_STRING = 0 ;
const KEY_STRING = 1 ;
const CLASS_NAME_STRING = 2 ;
const FUNCTION_NAME_STRING = 3 ;

function serializeString( v , runtime , stringType = VALUE_STRING ) {
	if ( ! v ) {
		runtime.swBuffer.writeUInt8( common.TYPE_EMPTY_STRING ) ;
		return ;
	}

	var byteLength = Buffer.byteLength( v ) ;

	if ( byteLength >= 3 && (
		runtime.referenceStrings
		|| ( stringType === KEY_STRING && runtime.referenceKeyStrings && byteLength <= 255 )
		|| ( stringType === CLASS_NAME_STRING && runtime.referenceClassNameStrings && byteLength <= 255 )
	) ) {
		let refId = runtime.stringRefs.get( v ) ;
		//console.log( "String Ref: " , v , refId ) ;

		if ( refId !== undefined ) {
			if ( refId <= 65535 ) {
				runtime.swBuffer.writeUInt8( common.TYPE_STRING_REF16 ) ;
				runtime.swBuffer.writeUInt16( refId ) ;
			}
			else {
				runtime.swBuffer.writeUInt8( common.TYPE_STRING_REF32 ) ;
				runtime.swBuffer.writeUInt32( refId ) ;
			}
		}
		else {
			if ( byteLength <= 255 ) {
				runtime.swBuffer.writeUInt8( common.TYPE_STORED_STRING_LPS8_UTF8 ) ;
				runtime.swBuffer.writeLps8Utf8( v , byteLength ) ;
			}
			else if ( byteLength <= 65535 ) {
				runtime.swBuffer.writeUInt8( common.TYPE_STORED_STRING_LPS16_UTF8 ) ;
				runtime.swBuffer.writeLps16Utf8( v , byteLength ) ;
			}
			else {
				runtime.swBuffer.writeUInt8( common.TYPE_STORED_STRING_LPS32_UTF8 ) ;
				runtime.swBuffer.writeLps32Utf8( v , byteLength ) ;
			}

			//console.log( "Setting string ref:" , v , runtime.stringRefCount ) ;
			runtime.stringRefs.set( v , runtime.stringRefCount ) ;
			runtime.stringRefCount ++ ;
		}

		return ;
	}

	if ( byteLength <= 255 ) {
		runtime.swBuffer.writeUInt8( common.TYPE_STRING_LPS8_UTF8 ) ;
		runtime.swBuffer.writeLps8Utf8( v , byteLength ) ;
	}
	else if ( byteLength <= 65535 ) {
		runtime.swBuffer.writeUInt8( common.TYPE_STRING_LPS16_UTF8 ) ;
		runtime.swBuffer.writeLps16Utf8( v , byteLength ) ;
	}
	else {
		runtime.swBuffer.writeUInt8( common.TYPE_STRING_LPS32_UTF8 ) ;
		runtime.swBuffer.writeLps32Utf8( v , byteLength ) ;
	}
}



function serializeFunction( v , runtime ) {
	// Of course, it doesn't work if it contains scope variable
	var s = v.toString() ;
	runtime.swBuffer.writeUInt8( common.TYPE_FUNCTION ) ;
	serializeString( s , runtime , FUNCTION_NAME_STRING ) ;
	runtime.swBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



function serializeAnyObject( v , runtime ) {
	var className , classData , objectData ,
		proto = Object.getPrototypeOf( v ) ;

	var refId = runtime.refs.get( v ) ;

	if ( refId !== undefined ) {
		runtime.swBuffer.writeUInt8( common.TYPE_REF ) ;
		//console.log( "Ref: " , refId ) ;
		runtime.swBuffer.writeUInt32( refId ) ;
		return ;
	}

	if ( Array.isArray( v ) ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeArray( v , runtime ) ;
	}

	if ( proto === Object.prototype || proto === null ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeStrictObject( v , runtime ) ;
	}

	if ( proto === Set.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeSet( v , runtime ) ;
	}

	if ( proto === Map.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeMap( v , runtime ) ;
	}

	if ( proto === Date.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeDate( v , runtime ) ;
	}

	if ( proto === Buffer.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeBuffer( v , runtime ) ;
	}

	if ( runtime.classMap && ( className = runtime.classMap.prototypeMap.get( proto ) ) ) {
		classData = runtime.classMap.classes[ className ] ;
	}
	else if ( runtime.universal ) {
		classData = runtime.universal ;

		// Default className, if not provided by the universal serializer...
		if ( typeof proto.constructor === 'function' ) { className = proto.constructor.name ; }
	}
	else if ( runtime.autoInstance && typeof proto.constructor === 'function' ) {
		className = proto.constructor.name ;
		classData = proto.constructor ;
	}

	if ( classData ) {
		if ( classData.serializer ) {
			// We let .serializeConstructedInstance() handle ref, because it is possible that args === v
			//runtime.refs.set( v , runtime.refCount ++ ) ;

			objectData = classData.serializer( v ) ;

			if ( objectData && typeof objectData === 'object' ) {
				if ( ! objectData.className ) { objectData.className = className ; }

				if ( classData.argumentsModel || classData.overrideModel ) {
					return serializeConstructedInstanceDataModel( v , objectData , runtime , classData.argumentsModel , classData.overrideModel ) ;
				}

				return serializeConstructedInstance( v , objectData , runtime ) ;
			}
			// Else we serialize it like a regular object
		}
		else {
			runtime.refs.set( v , runtime.refCount ++ ) ;
			if ( classData.model ) { return serializeInstanceDataModel( v , className , runtime , classData.model ) ; }
			return serializeInstance( v , className , runtime ) ;
		}
	}

	if ( runtime.prototypeChain ) {
		//runtime.refs.set( v , runtime.refCount ++ ) ;		// Nope! the prototype should be refered first!
		return serializePrototypedObject( v , proto , runtime ) ;
	}

	runtime.refs.set( v , runtime.refCount ++ ) ;
	return serializeStrictObject( v , runtime ) ;
}



function serializeArray( v , runtime ) {
	if ( ! v.length ) {
		runtime.swBuffer.writeUInt8( common.TYPE_EMPTY_ARRAY ) ;
		return ;
	}

	runtime.swBuffer.writeUInt8( common.TYPE_ARRAY ) ;

	for ( let element of v ) {
		//console.log( "Serialize" , element ) ;
		serializeAnyType( element , runtime ) ;
	}

	runtime.swBuffer.writeUInt8( common.TYPE_CLOSE ) ;
	//console.log( "after close" ) ;
}



function serializeSet( v , runtime ) {
	if ( ! v.size ) {
		runtime.swBuffer.writeUInt8( common.TYPE_EMPTY_SET ) ;
		return ;
	}

	runtime.swBuffer.writeUInt8( common.TYPE_SET ) ;

	for ( let element of v ) {
		serializeAnyType( element , runtime ) ;
	}

	runtime.swBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



function serializeStrictObject( v , runtime ) {
	var keys = Object.keys( v ) ;

	if ( ! keys.length ) {
		runtime.swBuffer.writeUInt8( common.TYPE_EMPTY_OBJECT ) ;
		return ;
	}

	runtime.swBuffer.writeUInt8( common.TYPE_OBJECT ) ;
	serializeKV( v , runtime , keys ) ;
	runtime.swBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



function serializeKV( v , runtime , keys = Object.keys( v ) ) {
	for ( let key of keys ) {
		if ( typeof key === 'string' ) {
			serializeString( key , runtime , KEY_STRING ) ;
		}
		else {
			serializeAnyType( key , runtime ) ;
		}

		serializeAnyType( v[ key ] , runtime ) ;
	}
}



function serializePrototypedObject( v , proto , runtime ) {
	runtime.swBuffer.writeUInt8( common.TYPE_PROTOTYPED_OBJECT ) ;
	serializeAnyType( proto , runtime ) ;

	// Add the ref AFTER its prototype chain!
	runtime.refs.set( v , runtime.refCount ++ ) ;
	serializeKV( v , runtime ) ;
	runtime.swBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



function serializeMap( v , runtime ) {
	var pair ;

	if ( ! v.size ) {
		runtime.swBuffer.writeUInt8( common.TYPE_EMPTY_MAP ) ;
		return ;
	}

	runtime.swBuffer.writeUInt8( common.TYPE_MAP ) ;

	for ( pair of v ) {
		serializeAnyType( pair[ 0 ] , runtime ) ;
		serializeAnyType( pair[ 1 ] , runtime ) ;
	}

	runtime.swBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



function serializeInstance( v , className , runtime ) {
	var keys , key ;

	keys = Object.keys( v ) ;

	if ( ! keys.length ) {
		runtime.swBuffer.writeUInt8( common.TYPE_EMPTY_INSTANCE ) ;
		serializeString( className , runtime , CLASS_NAME_STRING ) ;
		return ;
	}

	runtime.swBuffer.writeUInt8( common.TYPE_INSTANCE ) ;
	serializeString( className , runtime , CLASS_NAME_STRING ) ;
	serializeKV( v , runtime , keys ) ;
	runtime.swBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



function serializeInstanceDataModel( v , className , runtime , model ) {
	runtime.swBuffer.writeUInt8( common.TYPE_INSTANCE_DATA_MODEL ) ;
	serializeString( className , runtime , CLASS_NAME_STRING ) ;
	serializeKVModel( v , runtime , model ) ;
}



const EMPTY_ARRAY = [] ;

function serializeConstructedInstance( v , objectData , runtime ) {
	var instanceId = runtime.refCount ++ ;

	runtime.swBuffer.writeUInt8( common.TYPE_CONSTRUCTED_INSTANCE ) ;
	serializeString( objectData.className , runtime , CLASS_NAME_STRING ) ;

	if ( Array.isArray( objectData.args ) ) {
		serializeAnyType( objectData.args , runtime ) ;
		//serializeArray( objectData.args , runtime ) ;	// Cause trouble with references
	}
	else {
		//serializeAnyType( EMPTY_ARRAY , runtime ) ;
		runtime.swBuffer.writeUInt8( common.TYPE_EMPTY_ARRAY ) ;	// Should not cause trouble with references
	}

	// We should set the ref ONCE the constructor args is sent, not before,
	// because it is possible that args === v
	runtime.refs.set( v , instanceId ) ;

	if ( objectData.overrideKeys ) {
		let override = objectData.override && typeof objectData.override === 'object' ? objectData.override : v ;
		serializeKV( override , runtime , objectData.overrideKeys ) ;
	}
	else if ( objectData.override && typeof objectData.override === 'object' ) {
		serializeKV( objectData.override , runtime ) ;
	}

	runtime.swBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



function serializeConstructedInstanceDataModel( v , objectData , runtime , argumentsModel , overrideModel ) {
	var instanceId = runtime.refCount ++ ;

	runtime.swBuffer.writeUInt8( common.TYPE_CONSTRUCTED_INSTANCE_DATA_MODEL ) ;
	serializeString( objectData.className , runtime , CLASS_NAME_STRING ) ;

	if ( argumentsModel ) {
		serializeAnyModel( objectData.args , runtime , argumentsModel ) ;
	}
	else if ( Array.isArray( objectData.args ) ) {
		serializeAnyType( objectData.args , runtime ) ;
		//serializeArray( objectData.args , runtime ) ;	// Cause trouble with references
	}
	else {
		//serializeAnyType( EMPTY_ARRAY , runtime ) ;
		runtime.swBuffer.writeUInt8( common.TYPE_EMPTY_ARRAY ) ;	// Should not cause trouble with references
	}

	// We should set the ref ONCE the constructor args is sent, not before,
	// because it is possible that args === v
	runtime.refs.set( v , instanceId ) ;

	if ( overrideModel ) {
		// If there is a model, it forces serializing objectData.override even if it doesn't exist,
		// because the unserializer is expecting it.
		serializeKVModel( objectData.override , runtime , overrideModel ) ;
	}
	else {
		if ( objectData.override && typeof objectData.override === 'object' ) {
			serializeKV( objectData.override , runtime ) ;
		}

		runtime.swBuffer.writeUInt8( common.TYPE_CLOSE ) ;
	}
}



function serializeDate( v , runtime ) {
	runtime.swBuffer.writeUInt8( common.TYPE_DATE ) ;
	runtime.swBuffer.writeNumber( v.getTime() ) ;
}



function serializeBuffer( v , runtime ) {
	runtime.swBuffer.writeUInt8( common.TYPE_BUFFER ) ;
	runtime.swBuffer.writeUInt32( v.length ) ;
	runtime.swBuffer.writeBuffer( v ) ;
}



// Models

function serializeRootModel( v , runtime ) {
	runtime.swBuffer.writeUInt8( common.TYPE_ROOT_DATA_MODEL ) ;
	serializeAnyModel( v , runtime , runtime.model ) ;
}



function serializeAnyModel( v , runtime , model ) {
	if ( model.isArray ) {
		if ( model.fixedLength ) {
			serializeFixedTypedArrayModel( v , runtime , model ) ;
		}
		else {
			serializeTypedArrayModel( v , runtime , model ) ;
		}
	}
	else {
		serializeSealedObjectModel( v , runtime , model ) ;
	}
}



const WRITERS = {
	number: 'writeNumber' ,		// For instance, it's the same than float64
	boolean: 'writeBoolean' ,
	float32: 'writeFloat' ,
	float64: 'writeDouble' ,
	uint8: 'writeUInt8' ,
	int8: 'writeInt8' ,
	uint16: 'writeUInt16' ,
	int16: 'writeInt16' ,
	uint32: 'writeUInt32' ,
	int32: 'writeInt32' ,
	lps8string: 'writeLps8Utf8' ,
	lps16string: 'writeLps16Utf8' ,
	lps32string: 'writeLps32Utf8'
} ;



function serializeTypedArrayModel( v , runtime , model ) {
	runtime.swBuffer.writeUInt32( + v.length || 0 ) ;

	var type = model.ofType ;

	if ( type === 'any' ) {
		for ( let i = 0 ; i < v.length ; i ++ ) {
			serializeAnyType( v[ i ] , runtime ) ;
		}
	}
	else if ( type.isDataModel ) {
		for ( let i = 0 ; i < v.length ; i ++ ) {
			serializeAnyModel( v[ i ] , runtime , type ) ;
		}
	}
	else {
		let methodName = WRITERS[ type ] ;

		for ( let i = 0 ; i < v.length ; i ++ ) {
			runtime.swBuffer[ methodName ]( v[ i ] ) ;
		}
	}
}



function serializeFixedTypedArrayModel( v , runtime , model ) {
	var type = model.ofType ;

	if ( type === 'any' ) {
		for ( let i = 0 ; i < model.length ; i ++ ) {
			serializeAnyType( v[ i ] , runtime ) ;
		}
	}
	else if ( type.isDataModel ) {
		for ( let i = 0 ; i < model.length ; i ++ ) {
			serializeAnyModel( v[ i ] , runtime , type ) ;
		}
	}
	else {
		let methodName = WRITERS[ type ] ;

		for ( let i = 0 ; i < model.length ; i ++ ) {
			runtime.swBuffer[ methodName ]( v[ i ] ) ;
		}
	}
}



function serializeSealedObjectModel( v , runtime , model ) {
	for ( let [ key , type ] of model.keyTypePairs ) {
		if ( type === 'any' ) {
			serializeAnyType( v[ key ] , runtime ) ;
		}
		else if ( type.isDataModel ) {
			serializeAnyModel( v[ key ] , runtime , type ) ;
		}
		else {
			runtime.swBuffer[ WRITERS[ type ] ]( v[ key ] ) ;
		}
	}
}

const serializeKVModel = serializeSealedObjectModel ;

