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



describe( "JSON stringify" , function() {
	
	it( "basic test" , function( done ) {
		
		var serialize = jsbindat.serializer( {} ) ;
		var stream = fs.createWriteStream( './out.jsdat' ) ;
		serialize( undefined , stream ) ;
		setTimeout( done , 500 ) ;
		return ;
		
		
		testStringifyEq( serialize , undefined ) ;
		testStringifyEq( serialize , null ) ;
		testStringifyEq( serialize , true ) ;
		testStringifyEq( serialize , false ) ;
		
		testStringifyEq( serialize , 0 ) ;
		testStringifyEq( serialize , 0.0000000123 ) ;
		testStringifyEq( serialize , -0.0000000123 ) ;
		testStringifyEq( serialize , 1234 ) ;
		testStringifyEq( serialize , -1234 ) ;
		testStringifyEq( serialize , NaN ) ;
		testStringifyEq( serialize , Infinity ) ;
		testStringifyEq( serialize , - Infinity ) ;
		
		testStringifyEq( serialize , '' ) ;
		testStringifyEq( serialize , '0' ) ;
		testStringifyEq( serialize , '1' ) ;
		testStringifyEq( serialize , '123' ) ;
		testStringifyEq( serialize , 'A' ) ;
		testStringifyEq( serialize , 'ABC' ) ;
		testStringifyEq( serialize , '\ta"b"c\n\rAB\tC\né~\'#&|_\\-ł"»¢/æ//nĸ^' ) ;
		testStringifyEq( serialize , '\t\v\x00\x01\x7f\x1fa\x7fa' ) ;
		
		testStringifyEq( serialize , {} ) ;
		testStringifyEq( serialize , {a:1,b:'2'} ) ;
		testStringifyEq( serialize , {a:1,b:'2',c:true,d:null,e:undefined} ) ;
		testStringifyEq( serialize , {a:1,b:'2',sub:{c:true,d:null,e:undefined,sub:{f:''}}} ) ;
		
		testStringifyEq( serialize , [] ) ;
		testStringifyEq( serialize , [1,'2'] ) ;
		testStringifyEq( serialize , [1,'2',[null,undefined,true]] ) ;
		
		testStringifyEq( serialize , require( '../sample/sample1.json' ) ) ;
		testStringifyEq( serialize , require( '../sample/stringFlatObject.js' ) ) ;
		
		// Investigate why it does not work
		//testStringifyEq( serialize , require( '../sample/garbageStringObject.js' ) ) ;
	} ) ;
} ) ;



