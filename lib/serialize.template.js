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



function serializeAnyObject( v , runtime )
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
		serializeArray( v , runtime ) ;
	}
	else
	{
		serializeStrictObject( v , runtime ) ;
	}
	
	runtime.ancestors.pop() ;	//# noCircularRefNotation!
}



function serializeArray( v , runtime )
{
	var i = 1 , iMax = v.length ;
	
	if ( ! iMax )
	{
		runtime.str += '[]' ;
		return ;
	}
	
	runtime.depth ++ ;	//# noDepthTracking!
	runtime.str += '[' ;
	
	var valueIndent = '\n' + indentString.repeat( runtime.depth ) ;	//# noIndent!
	
	// Unroll the first iteration to avoid to test if a comma is needed for each loop iteration (gain 5% of perf)
	runtime.path.push( 0 ) ;	//# noUniqueRefNotation!
	runtime.str += valueIndent ;	//# noIndent!
	serializeAnyType( v[ 0 ] , runtime ) ;
	
	for ( ; i < iMax ; i ++ )
	{
		runtime.str += ',' ;
		runtime.path[ runtime.path.length - 1 ] = i ;	//# noUniqueRefNotation!
		runtime.str += valueIndent ;	//# noIndent!
		serializeAnyType( v[ i ] , runtime ) ;
	}
	
	runtime.path.pop() ;	//# noUniqueRefNotation!
	runtime.depth -- ;	//# noDepthTracking!
	runtime.str += '\n' + indentString.repeat( runtime.depth ) ;	//# noIndent!
	runtime.str += ']' ;
}



function serializeStrictObject( v , runtime )
{
	var i = 0 , iMax , keys ;
	
	keys = Object.keys( v ) ;
	iMax = keys.length ;
	
	runtime.depth ++ ;	//# noDepthTracking!
	runtime.str += '{' ;
	
	var keyIndent = '\n' + indentString.repeat( runtime.depth ) ;	//# noIndent!
	
	// Slower but use slightly less memory:
	//for ( k in v ) { if ( v[ k ] !== undefined && v.hasOwnProperty( k ) ) { ...
	
	for ( ; i < iMax ; i ++ )
	{
		if ( v[ keys[ i ] ] !== undefined )
		{
			runtime.str += keyIndent ;	//# noIndent!
			serializeString( keys[ i ] , runtime ) ;
			runtime.str += ':' ;
			runtime.str += ' ' ;	//# noIndent!
			runtime.path.push( keys[ i ] ) ;	//# noUniqueRefNotation!
			serializeAnyType( v[ keys[ i ] ] , runtime ) ;
			
			// This way we avoid an if statement for the comma (gain 5% of perf)
			i ++ ;
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
	}
	
	runtime.depth -- ;	//# noDepthTracking!
	runtime.str += '}' ;
}



