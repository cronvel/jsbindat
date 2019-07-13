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



const StreamBuffer = require( 'stream-kit/lib/StreamBuffer.js' ) ;
const ClassMap = require( './ClassMap.js' ) ;
const common = require( './common.js' ) ;

//function noop() {}



async function serialize( stream , v , options ) {
	options = options || {} ;
	var classMap = options.classMap ;
	if ( classMap && ! ( classMap instanceof ClassMap ) ) { classMap = new ClassMap( classMap ) ; }

	var runtime = {
		streamBuffer: StreamBuffer.create( stream ) ,
		universal: options.universal ,
		classMap: classMap ,
		autoInstance: options.autoInstance ,
		prototypeChain: options.prototypeChain ,
		refCount: 0	,
		refs: new WeakMap()
	} ;

	await serializeAnyType( v , runtime ) ;
	//console.log( "After serialize/serializeAnyType" ) ;
	await runtime.streamBuffer.flush() ;
	//console.log( "After flush" ) ;
}



module.exports = serialize ;



async function serializeAnyType( v , runtime ) {
	switch ( v ) {
		case undefined :
			await runtime.streamBuffer.writeUInt8( common.TYPE_UNDEFINED ) ;
			return ;
		case null :
			await runtime.streamBuffer.writeUInt8( common.TYPE_NULL ) ;
			return ;
		case true :
			await runtime.streamBuffer.writeUInt8( common.TYPE_TRUE ) ;
			return ;
		case false :
			await runtime.streamBuffer.writeUInt8( common.TYPE_FALSE ) ;
			return ;

		// Prototype constants
		case Object.prototype :
			await runtime.streamBuffer.writeUInt8( common.TYPE_OBJECT_PROTOTYPE ) ;
			return ;
	}

	switch ( typeof v ) {
		case 'number' :
			await serializeNumber( v , runtime ) ;
			return ;
		case 'string' :
			await serializeString( v , runtime ) ;
			return ;
		case 'object' :
			await serializeAnyObject( v , runtime ) ;
			return ;
	}

	// Unsupported data
	await runtime.streamBuffer.writeUInt8( common.TYPE_UNSUPPORTED ) ;
}



async function serializeNumber( v , runtime ) {
	// We could store anything in the "number" type, but this way it takes more space than JSON (8 bytes per number).
	// Instead, we try to detect if a number is an integer to use the appropriate binary type.

	if ( v === 0 ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_ZERO ) ;
	}
	else if ( v === 1 ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_ONE ) ;
	}
	else if ( ! isFinite( v ) || v !== Math.round( v ) ) {
		// Floating point number
		await runtime.streamBuffer.writeUInt8( common.TYPE_NUMBER ) ;
		await runtime.streamBuffer.writeNumber( v ) ;
	}
	else if ( v >= 0 ) {
		if ( v <= 255 ) {
			await runtime.streamBuffer.writeUInt8( common.TYPE_UINT8 ) ;
			await runtime.streamBuffer.writeUInt8( v ) ;
		}
		else if ( v <= 65535 ) {
			await runtime.streamBuffer.writeUInt8( common.TYPE_UINT16 ) ;
			await runtime.streamBuffer.writeUInt16( v ) ;
		}
		else if ( v <= 4294967295 ) {
			await runtime.streamBuffer.writeUInt8( common.TYPE_UINT32 ) ;
			await runtime.streamBuffer.writeUInt32( v ) ;
		}
		else {
			await runtime.streamBuffer.writeUInt8( common.TYPE_NUMBER ) ;
			await runtime.streamBuffer.writeNumber( v ) ;
		}
	}
	else if ( v >= -128 ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_INT8 ) ;
		await runtime.streamBuffer.writeInt8( v ) ;
	}
	else if ( v >= -32768 ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_INT16 ) ;
		await runtime.streamBuffer.writeInt16( v ) ;
	}
	else if ( v >= -2147483648 ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_INT32 ) ;
		await runtime.streamBuffer.writeInt32( v ) ;
	}
	else {
		await runtime.streamBuffer.writeUInt8( common.TYPE_NUMBER ) ;
		await runtime.streamBuffer.writeNumber( v ) ;
	}
}



async function serializeString( v , runtime ) {
	if ( ! v ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_STRING ) ;
		return ;
	}

	var byteLength = Buffer.byteLength( v ) ;

	if ( byteLength <= 255 ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_STRING_LPS8_UTF8 ) ;
		await runtime.streamBuffer.writeLps8Utf8( v , byteLength ) ;
	}
	else if ( byteLength <= 65535 ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_STRING_LPS16_UTF8 ) ;
		await runtime.streamBuffer.writeLps16Utf8( v , byteLength ) ;
	}
	else {
		await runtime.streamBuffer.writeUInt8( common.TYPE_STRING_LPS32_UTF8 ) ;
		await runtime.streamBuffer.writeLps32Utf8( v , byteLength ) ;
	}
}



async function serializeAnyObject( v , runtime ) {
	var className , classData , objectData ,
		proto = Object.getPrototypeOf( v ) ;

	var refId = runtime.refs.get( v ) ;

	if ( refId !== undefined ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_REF ) ;
		//console.log( "Ref: " , refId ) ;
		await runtime.streamBuffer.writeUInt32( refId ) ;
		return ;
	}

	if ( Array.isArray( v ) ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return await serializeArray( v , runtime ) ;
	}

	if ( proto === Object.prototype || proto === null ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return await serializeStrictObject( v , runtime ) ;
	}

	if ( proto === Set.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return await serializeSet( v , runtime ) ;
	}

	if ( proto === Map.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return await serializeMap( v , runtime ) ;
	}

	if ( proto === Buffer.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return await serializeBuffer( v , runtime ) ;
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
				return await serializeConstructedInstance( v , objectData , runtime ) ;
			}
			// Else we serialize it like a regular object
		}
		else {
			runtime.refs.set( v , runtime.refCount ++ ) ;
			return await serializeInstance( v , className , runtime ) ;
		}
	}

	if ( runtime.prototypeChain ) {
		//runtime.refs.set( v , runtime.refCount ++ ) ;		// Nope! the prototype should be refered first!
		return await serializePrototypedObject( v , proto , runtime ) ;
	}

	runtime.refs.set( v , runtime.refCount ++ ) ;
	return await serializeStrictObject( v , runtime ) ;
}



async function serializeArray( v , runtime ) {
	var element ;

	if ( ! v.length ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_ARRAY ) ;
		return ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_ARRAY ) ;

	for ( element of v ) {
		//console.log( "Serialize" , element ) ;
		await serializeAnyType( element , runtime ) ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
	//console.log( "after close" ) ;
}



async function serializeSet( v , runtime ) {
	var element ;

	if ( ! v.size ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_SET ) ;
		return ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_SET ) ;

	for ( element of v ) {
		await serializeAnyType( element , runtime ) ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



async function serializeStrictObject( v , runtime ) {
	var keys , key ;

	keys = Object.keys( v ) ;

	if ( ! keys.length ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_OBJECT ) ;
		return ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_OBJECT ) ;

	for ( key of keys ) {
		await serializeAnyType( key , runtime ) ;
		await serializeAnyType( v[ key ] , runtime ) ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



async function serializePrototypedObject( v , proto , runtime ) {
	var keys , key ;

	keys = Object.keys( v ) ;

	await runtime.streamBuffer.writeUInt8( common.TYPE_PROTOTYPED_OBJECT ) ;
	await serializeAnyType( proto , runtime ) ;

	// Add the ref AFTER its prototype chain!
	runtime.refs.set( v , runtime.refCount ++ ) ;

	for ( key of keys ) {
		await serializeAnyType( key , runtime ) ;
		await serializeAnyType( v[ key ] , runtime ) ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



async function serializeMap( v , runtime ) {
	var pair ;

	if ( ! v.size ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_MAP ) ;
		return ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_MAP ) ;

	for ( pair of v ) {
		await serializeAnyType( pair[ 0 ] , runtime ) ;
		await serializeAnyType( pair[ 1 ] , runtime ) ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



async function serializeInstance( v , className , runtime ) {
	var keys , key ;

	keys = Object.keys( v ) ;

	if ( ! keys.length ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_INSTANCE ) ;
		await serializeString( className , runtime ) ;
		return ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_INSTANCE ) ;
	await serializeString( className , runtime ) ;

	for ( key of keys ) {
		await serializeAnyType( key , runtime ) ;
		await serializeAnyType( v[ key ] , runtime ) ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



async function serializeConstructedInstance( v , objectData , runtime ) {
	var keys , key , overide ,
		instanceId = runtime.refCount ++ ;

	await runtime.streamBuffer.writeUInt8( common.TYPE_CONSTRUCTED_INSTANCE ) ;
	await serializeString( objectData.className , runtime ) ;
	await serializeAnyType( Array.isArray( objectData.args ) ? objectData.args : null , runtime ) ;

	// We should set the ref ONCE the constructor args is sent, not before,
	// because it is possible that args === v
	runtime.refs.set( v , instanceId ) ;

	if ( objectData.overideKeys ) {
		overide = objectData.overide && typeof objectData.overide === 'object' ? objectData.overide : v ;

		for ( key of objectData.overideKeys ) {
			if ( Object.prototype.hasOwnProperty.call( overide , key ) ) {
				await serializeAnyType( key , runtime ) ;
				await serializeAnyType( overide[ key ] , runtime ) ;
			}
		}
	}
	else if ( objectData.overide && typeof objectData.overide === 'object' ) {
		keys = Object.keys( objectData.overide ) ;

		for ( key of keys ) {
			await serializeAnyType( key , runtime ) ;
			await serializeAnyType( objectData.overide[ key ] , runtime ) ;
		}
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
}



async function serializeBuffer( v , runtime ) {
	await runtime.streamBuffer.writeUInt8( common.TYPE_BUFFER ) ;
	await runtime.streamBuffer.writeUInt32( v.length ) ;
	await runtime.streamBuffer.write( v ) ;
}

