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
var indentString = '  ' ;

//#depthLimitValue -> depthLimit
//#indentString -> indentString



function serialize( v , stream , callback )
{
	var runtime = {
		streamBuffer: StreamBuffer.create( stream , null , 1024 )
		, depth: 0	//# noDepthTracking!
		, ancestors: []	//# noCircularRefNotation!
		, path: []		//# noUniqueRefNotation!
		, refs: new WeakMap()	//# noUniqueRefNotation!
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
			if ( v.length <= 16 )
			{
				// If the length of the string is small, write it immediately
				serializeString( v , runtime ) ;
				return true ;
			}
			else
			{
				serializeString( v , runtime , callback ) ;
				return false ;
			}
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
	/*
	else if ( v.length <= 127 && ( bytes = Buffer.byteLength( v ) ) <= 255 )
	{
		runtime.streamBuffer.writeUInt8( common.TYPE_TINY_STRING_LPS_UTF8 ) ;	// Don't care about the callback for the first one
		runtime.streamBuffer.writeTinyLpsUtf8( v , callback ) ;
	}
	*/
	else
	{
		runtime.streamBuffer.writeUInt8( common.TYPE_STRING_LPS_UTF8 ) ;	// Don't care about the callback for the first one
		runtime.streamBuffer.writeLpsUtf8( v , callback ) ;
	}
}



function serializeAnyObject( v , runtime , callback )
{
	//*# noCircularRefNotation!
	var indexOf = runtime.ancestors.indexOf( v ) ;
	
	if ( indexOf !== -1 )
	{
		runtime.str += '{"@@ref@@":' + ( indexOf - runtime.ancestors.length ) + '}' ;
		return ;
	}
	//*/
	
	//*# noUniqueRefNotation!
	var path = runtime.refs.get( v ) ;
	
	if ( path )
	{
		runtime.str += '{"@@ref@@":' + JSON.serialize( path ) + '}' ;
		return ;
	}
	
	runtime.refs.set( v , runtime.path.slice() ) ;
	//*/
	
	//*# noDepthLimit!
	if ( runtime.depth >= depthLimit )
	{
		runtime.str += 'null' ;
		return ;
	}
	//*/
	
	//*# noToJSON!
	if ( typeof v.toJSON === 'function' )
	{
		runtime.str += v.toJSON() ;
		return ;
	}
	//*/
	
	runtime.ancestors.push( v ) ;	//# noCircularRefNotation!
	
	if ( Array.isArray( v ) )
	{
		serializeArray( v , runtime , callback ) ;
	}
	else
	{
		serializeStrictObject( v , runtime , callback ) ;
	}
	
	runtime.ancestors.pop() ;	//# noCircularRefNotation!
}



function serializeArray( v , runtime , callback )
{
	if ( ! v.length )
	{
		runtime.streamBuffer.writeUInt8( common.TYPE_EMPTY_ARRAY , callback ) ;
		return ;
	}
	
	runtime.streamBuffer.writeUInt8( common.TYPE_ARRAY ) ;	// Don't care about the callback for the first one
	runtime.depth ++ ;	//# noDepthTracking!
	
	serializeArrayContent( v , 0 , runtime , function() {
		
		runtime.path.pop() ;	//# noUniqueRefNotation!
		runtime.depth -- ;	//# noDepthTracking!
		runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE , callback ) ;
	} ) ;
}



function serializeArrayContent( v , index , runtime , callback )
{
	var avoided ;
	
	while ( index < v.length )
	{
		runtime.path[ runtime.path.length - 1 ] = index ;	//# noUniqueRefNotation!
		
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
	runtime.depth ++ ;	//# noDepthTracking!
	
	
	serializeObjectContent( v , keys , 0 , false , runtime , function() {
		
		runtime.path.pop() ;	//# noUniqueRefNotation!
		runtime.depth -- ;	//# noDepthTracking!
		runtime.streamBuffer.writeUInt8( common.TYPE_CLOSE , callback ) ;
	} ) ;
}	

	
	
function serializeObjectContent( v , keys , index , keyAlreadyWritten , runtime , callback )
{
	var avoided ;
	
	while ( index < keys.length )
	{
		if ( ! keyAlreadyWritten )
		{
			runtime.path[ runtime.path.length - 1 ] = keys[ index ] ;	//# noUniqueRefNotation!
			
			avoided = serializeAnyTypeAvoidCB(
				keys[ index ] ,
				runtime ,
				serializeObjectContent.bind( undefined , v , keys , index + 1 , true , runtime , callback )
			) ;
			
			// if callback will be used, return now and wait
			if ( ! avoided ) { return ; }
		}
		
		avoided = serializeAnyTypeAvoidCB(
			v[ keys[ index ] ] ,
			runtime ,
			serializeObjectContent.bind( undefined , v , keys , index + 1 , false , runtime , callback )
		) ;
		
		// if callback will be used, return now and wait
		if ( ! avoided ) { return ; }
		
		index ++ ;
	}
	
	callback() ;
}
/*
for ( ; i < iMax ; i ++ )
{
	for ( ; i < iMax ; i ++ )
	{
		if ( v[ keys[ i ] ] !== undefined )
		{
			runtime.str += ',' ;
			runtime.str += keyIndent ;	//# noIndent!
			serializeString( keys[ i ] , runtime ) ;
			runtime.str += ':' ;
			runtime.str += ' ' ;	//# noIndent!
			runtime.path[ runtime.path.length - 1 ] = keys[ i ] ;	//# noUniqueRefNotation!
			serializeAnyType( v[ keys[ i ] ] , runtime ) ;
		}
	}
	
	runtime.path.pop() ;	//# noUniqueRefNotation!
	runtime.depth -- ;	//# noDepthTracking!
	runtime.str += '\n' + indentString.repeat( runtime.depth ) ;	//# noIndent!
	runtime.str += '}' ;
	return ;
}
*/


