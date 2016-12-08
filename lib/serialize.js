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



function serialize( v , stream , options , callback )
{
	if ( typeof options === 'function' ) { callback = options ; options = null ; }
	
	var runtime = {
		streamBuffer: StreamBuffer.create( stream ) ,
		classes: options && ( options.classes instanceof Map ) ? options.classes : null ,
		refCount: 0	,
		refs: new WeakMap()
	} ;
	
	serializeAnyType( v , runtime , function() {
		runtime.streamBuffer.flush( callback ) ;
	} ) ;
}



module.exports = serialize ;



function serializeAnyType( v , runtime , callback )
{
	switch ( v )
	{
		case undefined :
			runtime.streamBuffer.writeUInt8( common.TYPE_UNDEFINED , callback ) ;
			return ;
		case null :
			runtime.streamBuffer.writeUInt8( common.TYPE_NULL , callback ) ;
			return ;
		case true :
			runtime.streamBuffer.writeUInt8( common.TYPE_TRUE , callback ) ;
			return ;
		case false :
			runtime.streamBuffer.writeUInt8( common.TYPE_FALSE , callback ) ;
			return ;
	}
	
	switch ( typeof v )
	{
		case 'number' :
			return serializeNumber( v , runtime , callback ) ;
		case 'string' :
			return serializeString( v , runtime , callback ) ;
		case 'object' :
			return serializeAnyObject( v , runtime , callback ) ;
	}
}



// Like serializeAnyType(), but avoid using the callback, return true if avoided (sync), false if async.
// Faster and less prone to stack overflow.
function serializeAnyTypeAvoidCB( v , runtime , callback )
{
	// If the buffer is not writeReady, serialize with the callback
	if ( ! runtime.streamBuffer.writeReady )
	{
		serializeAnyType( v , runtime , callback ) ;
		return false ;
	}
	
	switch ( v )
	{
		case undefined :
			runtime.streamBuffer.writeUInt8( common.TYPE_UNDEFINED ) ;
			return true ;
		case null :
			runtime.streamBuffer.writeUInt8( common.TYPE_NULL ) ;
			return true ;
		case true :
			runtime.streamBuffer.writeUInt8( common.TYPE_TRUE ) ;
			return true ;
		case false :
			runtime.streamBuffer.writeUInt8( common.TYPE_FALSE ) ;
			return true ;
	}
	
	switch ( typeof v )
	{
		case 'number' :
			serializeNumber( v , runtime ) ;
			return true ;
		case 'string' :
			if ( v.length <= 128 )
			{
				// If the length of the string is small enough, write it immediately
				serializeString( v , runtime ) ;
				return true ;
			}
			else
			{
				serializeString( v , runtime , callback ) ;
				return false ;
			}
			break ;	// to please jshint
		case 'object' :
			serializeAnyObject( v , runtime , callback ) ;
			return false ;
	}
}



function serializeNumber( v , runtime , callback )
{
	runtime.streamBuffer.writeUInt8( common.TYPE_NUMBER ) ;	// Don't care about the callback for the first one
	runtime.streamBuffer.writeNumber( v , callback ) ;
}



function serializeString( v , runtime , callback )
{
	var bytes ;
	
	if ( ! v )
	{
		runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_STRING , callback ) ;
	}
	else if ( v.length <= 127 )	// not needed because of UCS-2: Buffer.byteLength( v ) <= 255
	{
		runtime.streamBuffer.writeUInt8( common.TYPE_STRING_LPS8_UTF8 ) ;	// Don't care about the callback for the first one
		runtime.streamBuffer.writeLps8Utf8( v , callback ) ;
	}
	else
	{
		runtime.streamBuffer.writeUInt8( common.TYPE_STRING_LPS_UTF8 ) ;	// Don't care about the callback for the first one
		runtime.streamBuffer.writeLpsUtf8( v , callback ) ;
	}
}



function serializeAnyObject( v , runtime , callback )
{
	var serializer ;
	
	var refId = runtime.refs.get( v ) ;
	
	if ( refId !== undefined )
	{
		runtime.streamBuffer.writeUInt8( common.TYPE_REF ) ;	// Don't care about the callback for the first one
		//console.log( "Ref: " , refId ) ;
		runtime.streamBuffer.writeUInt32( refId , callback ) ;
		return ;
	}
	
	runtime.refs.set( v , runtime.refCount ++ ) ;
	
	if ( Array.isArray( v ) )
	{
		serializeArray( v , runtime , callback ) ;
	}
	else if ( runtime.classes && ( serializer = runtime.classes.get( Object.getPrototypeOf( v ) ) ) )
	{
		runtime.streamBuffer.writeUInt8( common.TYPE_INSTANCE ) ;	// Don't care about the callback for the first one
		serializeString( serializer.name , runtime ) ;	// Don't care about the callback again
		v = serializer( v ) ;
		
		serializeAnyType( v , runtime , function() {
			runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE , callback ) ;
		} ) ;
	}
	else
	{
		serializeStrictObject( v , runtime , callback ) ;
	}
}



function serializeArray( v , runtime , callback )
{
	if ( ! v.length )
	{
		runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_ARRAY , callback ) ;
		return ;
	}
	
	runtime.streamBuffer.writeUInt8( common.TYPE_ARRAY ) ;	// Don't care about the callback for the first one
	
	serializeArrayContent( v , 0 , runtime , function() {
		
		runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE , callback ) ;
	} ) ;
}



function serializeArrayContent( v , index , runtime , callback )
{
	var avoided ;
	
	while ( index < v.length )
	{
		avoided = serializeAnyTypeAvoidCB(
			v[ index ] ,
			runtime ,
			serializeArrayContent.bind( undefined , v , index + 1 , runtime , callback )
		) ;
		
		// if callback will be used, return now and wait
		if ( ! avoided ) { return ; }
		
		index ++ ;
	}
	
	callback() ;
}



function serializeStrictObject( v , runtime , callback )
{
	var i = 0 , iMax , keys ;
	
	keys = Object.keys( v ) ;
	
	if ( ! keys.length )
	{
		runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_OBJECT , callback ) ;
		return ;
	}
	
	iMax = keys.length ;
	
	runtime.streamBuffer.writeUInt8( common.TYPE_OBJECT ) ;	// Don't care about the callback for the first one
	
	serializeObjectContent( v , keys , 0 , true , runtime , function() {
		
		runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE , callback ) ;
	} ) ;
}	

	
	
function serializeObjectContent( v , keys , index , writeKey , runtime , callback )
{
	var avoided ;
	
	while ( index < keys.length )
	{
		if ( writeKey )
		{
			avoided = serializeAnyTypeAvoidCB(
				keys[ index ] ,
				runtime ,
				serializeObjectContent.bind( undefined , v , keys , index , false , runtime , callback )
			) ;
			
			// if callback will be used, return now and wait
			if ( ! avoided ) { return ; }
		}
		
		avoided = serializeAnyTypeAvoidCB(
			v[ keys[ index ] ] ,
			runtime ,
			serializeObjectContent.bind( undefined , v , keys , index + 1 , true , runtime , callback )
		) ;
		
		// if callback will be used, return now and wait
		if ( ! avoided ) { return ; }
		
		index ++ ;
		writeKey = true ;
	}
	
	callback() ;
}


