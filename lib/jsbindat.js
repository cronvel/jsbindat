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



var fs = require( 'fs' ) ;



var jsbindat = {} ;
module.exports = jsbindat ;



jsbindat.ClassMap = require( './ClassMap.js' ) ;
jsbindat.serialize = require( './serialize.js' ) ;
jsbindat.unserialize = require( './unserialize.js' ) ;



jsbindat.writeFile = function writeFile( filePath , data , options , callback )
{
	if ( typeof options === 'function' ) { callback = options ; options = null ; }
	
	var stream = fs.createWriteStream( filePath ) ;
	
	jsbindat.serialize( stream , data , options , function() {
		stream.end( callback ) ;
	} ) ;
} ;



jsbindat.readFile = function readFile( filePath , options , callback )
{
	if ( typeof options === 'function' ) { callback = options ; options = null ; }
	
	var stream = fs.createReadStream( filePath ) ;
	
	jsbindat.unserialize( stream , options , function( data ) {
		stream.close() ;
		if ( callback ) { callback( data ) ; }
	} ) ;
} ;


