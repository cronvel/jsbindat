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



var spp = require( 'smart-preprocessor' ) ;

var jsbindat = {} ;
module.exports = jsbindat ;



//jsbindat.stringifyStream = require( './stringifyStream.js' ) ;
//jsbindat.parseStream = require( './parseStream.js' ) ;



jsbindat.serializer = function createSerializer( options )
{
	var config = {} ;
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	config.noDepthTracking = true ;
	
	// Depth limit
	if ( typeof options.depth === 'number' && options.depth > 0 )
	{
		config.depthLimitValue = options.depth ;
		delete config.noDepthTracking ;
	}
	else
	{
		config.noDepthLimit = true ;
	}
	
	// Document depth limit
	if ( typeof options.documentDepth === 'number' && options.documentDepth > 0 )
	{
		config.documentDepthLimitValue = options.documentDepth ;
	}
	else
	{
		config.noDocumentDepthLimit = true ;
	}
	
	// Indentation
	if ( typeof options.indent === 'string' )
	{
		config.indentString = options.indent ;
		delete config.noDepthTracking ;
	}
	else
	{
		config.noIndent = true ;
	}
	
	// Use custom .toJSON() function?
	if ( options.useToJSON === false )
	{
		config.noToJSON = true ;
	}
	
	// Ref Notations
	if ( options.circularRefNotation )
	{
		config.noUniqueRefNotation = true ;
	}
	else if ( options.uniqueRefNotation )
	{
		config.noCircularRefNotation = true ;
	}
	else
	{
		config.noCircularRefNotation = true ;
		config.noUniqueRefNotation = true ;
	}
	
	// Use custom .toJSON() function?
	if ( ! options.propertyMask )
	{
		config.noPropertyMask = true ;
	}
	
	return spp.require( __dirname + '/serialize.template.js' , config , { multi: true } ) ;
} ;



/*
jsbindat.parser = function createParser( options )
{
	var config = {} ;
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	config.noDepthTracking = true ;
	
	// Depth limit
	if ( typeof options.depth === 'number' && options.depth > 0 )
	{
		config.depthLimitValue = options.depth ;
		delete config.noDepthTracking ;
	}
	else
	{
		config.noDepthLimit = true ;
	}
	
	// Ref Notations
	if ( ! ( options.refNotation || options.circularRefNotation || options.uniqueRefNotation ) )
	{
		config.noRefNotation = true ;
	}
	
	return spp.require( __dirname + '/parse.template.js' , config , { multi: true } ) ;
} ;
*/

