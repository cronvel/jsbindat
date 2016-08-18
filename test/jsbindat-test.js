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

/* jshint unused:false */
/* global describe, it, before, after */

"use strict" ;



var fs = require( 'fs' ) ;
var jsbindat = require( '../lib/jsbindat.js' ) ;
var expect = require( 'expect.js' ) ;





			/* Helpers */



function testStringifyEq( stringify , v )
{
	expect( stringify( v ) )
		.to.be( JSON.stringify( v ) ) ;
}

function testParseEq( parse , s )
{
	expect( JSON.stringify(
			parse( s )
		) )
		.to.be( JSON.stringify(
			JSON.parse( s )
		) ) ;
}




			/* Tests */



describe( "basic features" , function() {
	
	it( "xxx basic test" , function( done ) {
		
		var serialize = jsbindat.serializer( {} ) ;
		var stream = fs.createWriteStream( __dirname + '/out.jsdat' ) ;
		//serialize( undefined , stream ) ;
		
		serialize( 'grigrigredin' , stream , function() {
		//serialize( 123 , stream , function() {
			stream.end( done ) ;
		} ) ;
	} ) ;
	
	it( "zzz read test" , function( done ) {
		
		var unserialize = jsbindat.unserializer( {} ) ;
		var stream = fs.createReadStream( __dirname + '/out.jsdat' ) ;
		//serialize( undefined , stream ) ;
		
		unserialize( stream , function( data ) {
			console.log( '\n\n>>> data:' , data , '\n\n' )
			done() ;
		} ) ;
	} ) ;
} ) ;



