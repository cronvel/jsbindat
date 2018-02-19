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



//var StreamBuffer = require( 'stream-kit/lib/StreamBuffer.js' ) ;
var StreamBuffer = require( './StreamBuffer.js' ) ;
var ClassMap = require( './ClassMap.js' ) ;
var common = require( './common.js' ) ;

function noop() {}



async function serialize( stream , v , options ) {
	var runtime = {
		streamBuffer: StreamBuffer.create( stream ) ,
		classMap: options && ( options.classMap instanceof ClassMap ) ? options.classMap : null ,
		refCount: 0	,
		refs: new WeakMap()
	} ;

	await serializeAnyType( v , runtime ) ;
	await runtime.streamBuffer.flush() ;
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
}



async function serializeNumber( v , runtime ) {
	await runtime.streamBuffer.writeUInt8( common.TYPE_NUMBER ) ;
	await runtime.streamBuffer.writeNumber( v ) ;
}



async function serializeString( v , runtime ) {
	var bytes ;

	if ( ! v ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_STRING ) ;
	}
	else if ( v.length <= 127 )	// not needed because of UCS-2: Buffer.byteLength( v ) <= 255
	{
		await runtime.streamBuffer.writeUInt8( common.TYPE_STRING_LPS8_UTF8 ) ;
		await runtime.streamBuffer.writeLps8Utf8( v ) ;
	}
	else {
		await runtime.streamBuffer.writeUInt8( common.TYPE_STRING_LPS_UTF8 ) ;
		await runtime.streamBuffer.writeLpsUtf8( v ) ;
	}
}



async function serializeAnyObject( v , runtime ) {
	var className , proto = Object.getPrototypeOf( v ) ;

	var refId = runtime.refs.get( v ) ;

	if ( refId !== undefined ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_REF ) ;
		//console.log( "Ref: " , refId ) ;
		await runtime.streamBuffer.writeUInt32( refId ) ;
		return ;
	}

	runtime.refs.set( v , runtime.refCount ++ ) ;

	if ( Array.isArray( v ) ) {
		await serializeArray( v , runtime ) ;
	}
	else if ( proto === Set.prototype ) {
		await serializeSet( v , runtime ) ;
	}
	else if ( runtime.classMap && ( className = runtime.classMap.prototypeMap.get( proto ) ) ) {
		if ( runtime.classMap.classes[ className ].serializer ) {
			await runtime.streamBuffer.writeUInt8( common.TYPE_CONSTRUCTED_INSTANCE ) ;
			await serializeString( className , runtime ) ;

			v = runtime.classMap.classes[ className ].serializer( v ) ;

			await serializeAnyType( v[ 0 ] , runtime ) ;

			if ( ! v[ 1 ] || typeof v[ 1 ] !== 'object' ) {
				await runtime.streamBuffer.writeUInt8( common.TYPE_UNDEFINED ) ;
				await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
			}
			else {
				// We need to burn a ref ID, since we create an extra object
				runtime.refCount ++ ;

				await serializeStrictObject( v[ 1 ] , runtime ) ;
				await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
			}
		}
		else {
			await runtime.streamBuffer.writeUInt8( common.TYPE_INSTANCE ) ;
			await serializeString( className , runtime ) ;

			// We need to burn a ref ID, since we create an extra object
			runtime.refCount ++ ;

			await serializeStrictObject( v , runtime ) ;
			await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
		}
	}
	else {
		await serializeStrictObject( v , runtime ) ;
	}
}



async function serializeArray( v , runtime ) {
	var element ;

	if ( ! v.length ) {
		await runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_ARRAY ) ;
		return ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_ARRAY ) ;

	for ( element of v ) {
		await serializeAnyType( element , runtime ) ;
	}

	await runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE ) ;
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


