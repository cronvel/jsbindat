/*
	The Cedric's Swiss Knife (CSK) - CSK JSON

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



var depthLimit = Infinity ;
var indentString = '  ' ;

//#depthLimitValue -> depthLimit
//#indentString -> indentString



function serialize( v , stream )
{
	if ( v === undefined ) { return undefined ; }
	
	var runtime = {
		stream: stream ,
		buffer: new Buffer( 1024 ) ,
		, depth: 0	//# noDepthTracking!
		, ancestors: []	//# noCircularRefNotation!
		, path: []		//# noUniqueRefNotation!
		, refs: new WeakMap()	//# noUniqueRefNotation!
	} ;
	
	serializeAnyType( v , runtime ) ;
	
	return runtime.str ;
}



module.exports = serialize ;

var TYPE_CLOSE = 0x00 ;
var	TYPE_UNDEFINED = 0x01 ;
var TYPE_NULL = 0x02 ;
var TYPE_FALSE = 0x03 ;
var TYPE_TRUE = 0x04 ;
var TYPE_STRING = 0x11 ;
var TYPE_NUMBER = 0x21 ;
var TYPE_ARRAY = 0x31 ;
var TYPE_OBJECT = 0x41 ;



function serializeAnyType( v , runtime )
{
	if ( v === undefined )
	{
		writeUInt8( runtime ) ;
	}
	else if ( v === null )
	{
		
		stream.write( runtime.str += "null" ;
		return ;
	}
	
	switch ( typeof v )
	{
		case 'boolean' :
			return serializeBoolean( v , runtime ) ;
		case 'number' :
			return serializeNumber( v , runtime ) ;
		case 'string' :
			return serializeString( v , runtime ) ;
		case 'object' :
			return serializeAnyObject( v , runtime ) ;
	}
}



function serializeBoolean( v , runtime )
{
	runtime.str += ( v ? "true" : "false" ) ;
}



function serializeNumber( v , runtime )
{
	if ( Number.isNaN( v ) || v === Infinity || v === -Infinity ) { runtime.str += "null" ; }
	else { runtime.str += v ; }
}



function serializeString( v , runtime )
{
	var i = 0 , l = v.length , c ;
	
	// Faster on big string than serializeStringLookup(), also big string are more likely to have at least one bad char
	if ( l >= 200 ) { return serializeStringRegex( v , runtime ) ; }
	
	// Most string are left untouched, so it's worth checking first if something must be changed.
	// Gain 33% of perf on the whole serialize().
	for ( ; i < l ; i ++ )
	{
		c = v.charCodeAt( i ) ;
		
		if (
			c <= 0x1f ||	// control chars
			c === 0x5c ||	// backslash
			c === 0x22		// double quote
		)
		{
			if ( l > 100 )
			{
				serializeStringLookup( v , runtime ) ;
			}
			else
			{
				serializeStringRegex( v , runtime ) ;
			}
			
			return ;
		}
	}
	
	runtime.str += '"' + v + '"' ;
}



var serializeStringLookup_ = 
( function createStringifyStringLookup()
{
	var c = 0 , lookup = [] ;
	
	for ( ; c < 0x80 ; c ++ )
	{
		if ( c === 0x09 )	// tab
		{
			lookup[ c ] = '\\t' ;
		}
		else if ( c === 0x0a )	// new line
		{
			lookup[ c ] = '\\n' ;
		}
		else if ( c === 0x0c )	// form feed
		{
			lookup[ c ] = '\\f' ;
		}
		else if ( c === 0x0d )	// carriage return
		{
			lookup[ c ] = '\\r' ;
		}
		else if ( c <= 0x0f )	// control chars
		{
			lookup[ c ] = '\\u000' + c.toString( 16 ) ;
		}
		else if ( c <= 0x1f )	// control chars
		{
			lookup[ c ] = '\\u00' + c.toString( 16 ) ;
		}
		else if ( c === 0x5c )	// backslash
		{
			lookup[ c ] = '\\\\' ;
		}
		else if ( c === 0x22 )	// double-quote
		{
			lookup[ c ] = '\\"' ;
		}
		else
		{
			lookup[ c ] = String.fromCharCode( c ) ;
		}
	}
	
	return lookup ;
} )() ;



function serializeStringLookup( v , runtime )
{
	var i = 0 , iMax = v.length , c ;
	
	runtime.str += '"' ;
	
	for ( ; i < iMax ; i ++ )
	{
		c = v.charCodeAt( i ) ;
		
		if ( c < 0x80 )
		{
			runtime.str += serializeStringLookup_[ c ] ;
		}
		else
		{
			runtime.str += v[ i ] ;
		}
	}
	
	runtime.str += '"' ;
}



var serializeStringRegex_ = /[\x00-\x1f"\\]/g ;

function serializeStringRegex( v , runtime )
{
	runtime.str += '"' + v.replace( serializeStringRegex_ , serializeStringRegexCallback ) + '"' ;
}

function serializeStringRegexCallback( match )
{
	return serializeStringLookup_[ match.charCodeAt( 0 ) ] ;
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



