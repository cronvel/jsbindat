/*
	The Cedric's Swiss Knife (CSK) - CSK object tree toolbox test suite

	Copyright (c) 2014, 2015 Cédric Ronvel 
	
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
var json = require( '../lib/json.js' ) ;
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
	
	it( "basic test" , function() {
		
		var stringify = json.stringifier( {} ) ;
		
		testStringifyEq( stringify , undefined ) ;
		testStringifyEq( stringify , null ) ;
		testStringifyEq( stringify , true ) ;
		testStringifyEq( stringify , false ) ;
		
		testStringifyEq( stringify , 0 ) ;
		testStringifyEq( stringify , 0.0000000123 ) ;
		testStringifyEq( stringify , -0.0000000123 ) ;
		testStringifyEq( stringify , 1234 ) ;
		testStringifyEq( stringify , -1234 ) ;
		testStringifyEq( stringify , NaN ) ;
		testStringifyEq( stringify , Infinity ) ;
		testStringifyEq( stringify , - Infinity ) ;
		
		testStringifyEq( stringify , '' ) ;
		testStringifyEq( stringify , '0' ) ;
		testStringifyEq( stringify , '1' ) ;
		testStringifyEq( stringify , '123' ) ;
		testStringifyEq( stringify , 'A' ) ;
		testStringifyEq( stringify , 'ABC' ) ;
		testStringifyEq( stringify , '\ta"b"c\n\rAB\tC\né~\'#&|_\\-ł"»¢/æ//nĸ^' ) ;
		testStringifyEq( stringify , '\t\v\x00\x01\x7f\x1fa\x7fa' ) ;
		
		testStringifyEq( stringify , {} ) ;
		testStringifyEq( stringify , {a:1,b:'2'} ) ;
		testStringifyEq( stringify , {a:1,b:'2',c:true,d:null,e:undefined} ) ;
		testStringifyEq( stringify , {a:1,b:'2',sub:{c:true,d:null,e:undefined,sub:{f:''}}} ) ;
		
		testStringifyEq( stringify , [] ) ;
		testStringifyEq( stringify , [1,'2'] ) ;
		testStringifyEq( stringify , [1,'2',[null,undefined,true]] ) ;
		
		testStringifyEq( stringify , require( '../sample/sample1.json' ) ) ;
		testStringifyEq( stringify , require( '../sample/stringFlatObject.js' ) ) ;
		
		// Investigate why it does not work
		//testStringifyEq( stringify , require( '../sample/garbageStringObject.js' ) ) ;
	} ) ;
	
	it( "depth limit" , function() {
		
		var stringify = json.stringifier( { depth: 2 } ) ;
		
		var o = {
			a: 1,
			b: 2,
			c: {
				d: 4,
				e: 5
			}
		} ;
		
		expect( stringify( o , 1 ) ).to.be( '{"a":1,"b":2,"c":null}' ) ;
		expect( stringify( o , 2 ) ).to.be( '{"a":1,"b":2,"c":{"d":4,"e":5}}' ) ;
		expect( stringify( o ) ).to.be( '{"a":1,"b":2,"c":{"d":4,"e":5}}' ) ;
		
		var a = {
			k1: 1,
			k2: 2
		} ;
		
		var b = {
			k4: 1,
			k5: 2
		} ;
		
		a.k3 = b ;
		b.k6 = a ;
		
		o = {
			a: a,
			b: b
		} ;
		
		expect( stringify( a ) ).to.be( '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":null}}' ) ;
		expect( stringify( a , 2 ) ).to.be( '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":null}}' ) ;
		expect( stringify( a , 3 ) ).to.be( '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":null}}}' ) ;
		expect( stringify( a , 4 ) ).to.be( '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":null}}}}' ) ;
		
		expect( stringify( o ) ).to.be( '{"a":{"k1":1,"k2":2,"k3":null},"b":{"k4":1,"k5":2,"k6":null}}' ) ;
		expect( stringify( o , 2 ) ).to.be( '{"a":{"k1":1,"k2":2,"k3":null},"b":{"k4":1,"k5":2,"k6":null}}' ) ;
		expect( stringify( o , 3 ) ).to.be( '{"a":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":null}},"b":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":null}}}' ) ;
		expect( stringify( o , 4 ) ).to.be( '{"a":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":null}}},"b":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":null}}}}' ) ;
	} ) ;
	
	it( "document depth limit (roots-db compatible)" , function() {
		
		var stringify = json.stringifier( { documentDepth: 2 } ) ;
		
		var o = {
			a: 1,
			b: 2,
			c: {
				d: 4,
				e: 5
			}
		} ;
		
		Object.defineProperty( o , '$' , { value: {} } ) ;
		
		expect( stringify( o , 1 ) ).to.be( '{"a":1,"b":2,"c":{"d":4,"e":5}}' ) ;
		expect( stringify( o , 2 ) ).to.be( '{"a":1,"b":2,"c":{"d":4,"e":5}}' ) ;
		expect( stringify( o ) ).to.be( '{"a":1,"b":2,"c":{"d":4,"e":5}}' ) ;
		
		Object.defineProperty( o.c , '$' , { value: {} } ) ;
		
		expect( stringify( o , 1 ) ).to.be( '{"a":1,"b":2,"c":null}' ) ;
		expect( stringify( o , 2 ) ).to.be( '{"a":1,"b":2,"c":{"d":4,"e":5}}' ) ;
		expect( stringify( o ) ).to.be( '{"a":1,"b":2,"c":{"d":4,"e":5}}' ) ;
		
		var a = {
			k1: 1,
			k2: 2
		} ;
		
		var b = {
			k4: 1,
			k5: 2
		} ;
		
		a.k3 = b ;
		b.k6 = a ;
		
		o = {
			a: a,
			b: b
		} ;
		
		Object.defineProperty( o , '$' , { value: {} } ) ;
		Object.defineProperty( a , '$' , { value: {} } ) ;
		Object.defineProperty( b , '$' , { value: {} } ) ;
		
		expect( stringify( a ) ).to.be( '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":null}}' ) ;
		expect( stringify( a , 2 ) ).to.be( '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":null}}' ) ;
		expect( stringify( a , 3 ) ).to.be( '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":null}}}' ) ;
		expect( stringify( a , 4 ) ).to.be( '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":null}}}}' ) ;
		
		expect( stringify( o ) ).to.be( '{"a":{"k1":1,"k2":2,"k3":null},"b":{"k4":1,"k5":2,"k6":null}}' ) ;
		expect( stringify( o , 2 ) ).to.be( '{"a":{"k1":1,"k2":2,"k3":null},"b":{"k4":1,"k5":2,"k6":null}}' ) ;
		expect( stringify( o , 3 ) ).to.be( '{"a":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":null}},"b":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":null}}}' ) ;
		expect( stringify( o , 4 ) ).to.be( '{"a":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":null}}},"b":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":null}}}}' ) ;
	} ) ;
	
	it( "circular ref notation" , function() {
		
		var stringify = json.stringifier( { circularRefNotation: true } ) ;
		
		var a = {
			k1: 1,
			k2: 2
		} ;
		
		var b = {
			k4: 1,
			k5: 2
		} ;
		
		a.k3 = b ;
		b.k6 = a ;
		
		var o = {
			a: a,
			b: b
		} ;
		
		expect( stringify( a ) ).to.be( '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"@@ref@@":-2}}}' ) ;
		expect( stringify( o ) ).to.be( '{"a":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"@@ref@@":-2}}},"b":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":{"@@ref@@":-2}}}}' ) ;
	} ) ;
	
	it( "unique ref notation" , function() {
		
		var stringify = json.stringifier( { uniqueRefNotation: true } ) ;
		
		var a = {
			k1: 1,
			k2: 2
		} ;
		
		var b = {
			k4: 1,
			k5: 2
		} ;
		
		a.k3 = b ;
		b.k6 = a ;
		
		var o = {
			a: a,
			b: b
		} ;
		
		expect( stringify( a ) ).to.be( '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"@@ref@@":[]}}}' ) ;
		expect( stringify( o ) ).to.be( '{"a":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"@@ref@@":["a"]}}},"b":{"@@ref@@":["a","k3"]}}' ) ;
	} ) ;
	
	it( "property masks" , function() {
		
		var stringify = json.stringifier( { propertyMask: true } ) ;
		var o , mask ;
		
		o = {
			a: 'A',
			b: 2,
			c: 'three',
			sub: {
				d: 'dee!',
				f: 5,
				sub: {
					g: 'gee'
				},
				array: [
					{
						title: 'One two',
						text: 'blah'
					} ,
					{
						title: 'You should know that!',
						text: 'blah'
					} ,
					{
						title: '10 things about nothing',
						text: 'blah blih'
					}
				]
			}
		} ;
		
		mask = {
			a: true ,
			sub: {
				f: true ,
				sub: {
					g: true
				} ,
				array: {
					title: true
				}
			}
		} ;
		
		expect( stringify( o , mask ) ).to.be( '{"a":"A","sub":{"f":5,"sub":{"g":"gee"},"array":[{"title":"One two"},{"title":"You should know that!"},{"title":"10 things about nothing"}]}}' ) ;
		
		mask = {
			a: true ,
			sub: {
				f: true ,
				sub: true ,
				array: true
			}
		} ;
		
		expect( stringify( o , mask ) ).to.be( '{"a":"A","sub":{"f":5,"sub":{"g":"gee"},"array":[{"title":"One two","text":"blah"},{"title":"You should know that!","text":"blah"},{"title":"10 things about nothing","text":"blah blih"}]}}' ) ;
	} ) ;
	
	it( "indentation" , function() {
		
		var stringify = json.stringifier( { indent: '    ' } ) ;
		
		var o = {
			a: 1,
			b: {
				c: 3,
				d: 4,
				e: {
					f: 6,
					g: 7
				}
			} ,
			h: {
				i: 9,
				j: 10
			} ,
			k: [ 'a' , 'b' , 'c' , true , false , null , [ 0 , 1 , 2 , 3 ] , {} , [] ] ,
			i: {} ,
			j: []
		} ;
		
		//console.log( "JSON - pretty print:\n" + stringify( o ) ) ;
		expect( stringify( o ) ).to.be( '{\n    "a": 1,\n    "b": {\n        "c": 3,\n        "d": 4,\n        "e": {\n            "f": 6,\n            "g": 7\n        }\n    },\n    "h": {\n        "i": 9,\n        "j": 10\n    },\n    "k": [\n        "a",\n        "b",\n        "c",\n        true,\n        false,\n        null,\n        [\n            0,\n            1,\n            2,\n            3\n        ],\n        {},\n        []\n    ],\n    "i": {},\n    "j": []\n}' ) ;
	} ) ;
} ) ;


	
describe( "JSON parse" , function() {
	
	it( "basic test" , function() {
		
		var parse = json.parser( {} ) ;
		
		testParseEq( parse , 'null' ) ;
		testParseEq( parse , 'true' ) ;
		testParseEq( parse , 'false' ) ;
		
		testParseEq( parse , '0' ) ;
		testParseEq( parse , '1' ) ;
		testParseEq( parse , '123' ) ;
		testParseEq( parse , '-123' ) ;
		testParseEq( parse , '123.456' ) ;
		testParseEq( parse , '-123.456' ) ;
		testParseEq( parse , '0.123' ) ;
		testParseEq( parse , '-0.123' ) ;
		testParseEq( parse , '0.00123' ) ;
		testParseEq( parse , '-0.00123' ) ;
		
		testParseEq( parse , '""' ) ;
		testParseEq( parse , '"abc"' ) ;
		testParseEq( parse , '"abc\\"def"' ) ;
		testParseEq( parse , '"abc\\ndef\\tghi\\rjkl"' ) ;
		testParseEq( parse , '"abc\\u0000\\u007f\\u0061def\\"\\"jj"' ) ;
		
		testParseEq( parse , '{}' ) ;
		testParseEq( parse , '{"a":1}' ) ;
		testParseEq( parse , '{"a":1,"b":"string","c":"","d":null,"e":true,"f":false}' ) ;
		testParseEq( parse , '{"a":1,"b":"string","c":"","d":null,"e":true,"f":false,"sub":{"g":123,"h":{},"i":{"j":"J!"}}}' ) ;
		
		testParseEq( parse , '[]' ) ;
		testParseEq( parse , '[1,2,3]' ) ;
		testParseEq( parse , '[-12,1.5,"toto",true,false,null,0.3]' ) ;
		testParseEq( parse , '[-12,1.5,"toto",true,false,null,0.3,[1,2,3],[4,5,6]]' ) ;
		
		testParseEq( parse , '{"a":1,"b":"string","c":"","d":null,"e":true,"f":false,"sub":{"g":123,"h":[1,2,3],"i":["j","J!"]}}' ) ;
		testParseEq( parse , '[-12,1.5,"toto",{"g":123,"h":[1,2,3],"i":["j","J!"]},true,false,null,0.3,[1,2,3],[4,5,6]]' ) ;
		
		testParseEq( parse , ' { "a" :   1 , "b":  \n"string",\n  "c":"" \t,\n\t"d" :   null,"e":true,   "f"   :   false  , "sub":{"g":123,"h":[1,2,3],"i":["j","J!"]}}' ) ;
		
		testParseEq( parse , fs.readFileSync( __dirname + '/../sample/sample1.json' ).toString() ) ;
	} ) ;
	
	it( "depth limit" , function() {
		
		var parse = json.parser( { depth: 2 } ) ;
		
		var oJson ;
		
		oJson = '{"a":1,"b":2,"c":{"d":4,"e":5},"f":6}' ;
		expect( parse( oJson , 1 ) ).to.eql( {a:1,b:2,c:undefined,f:6} ) ;
		expect( parse( oJson , 2 ) ).to.eql( {a:1,b:2,c:{d:4,e:5},f:6} ) ;
		expect( parse( oJson ) ).to.eql( {a:1,b:2,c:{d:4,e:5},f:6} ) ;
		
		oJson = '{"a":1,"b":2,"c":{"nasty\\n\\"key}}]][{":"nasty[value{}}}]]"},"f":6}' ;
		expect( json.parser( { depth: 1 } )( oJson ) ).to.eql( {a:1,b:2,c:undefined,f:6} ) ;
	} ) ;
	
	it( "circular ref notation" , function() {
		
		var parse = json.parser( { refNotation: true } ) ;
		
		var aJson = '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"@@ref@@":-2}}}' ;
		var oJson = '{"a":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"@@ref@@":-2}}},"b":{"k4":1,"k5":2,"k6":{"k1":1,"k2":2,"k3":{"@@ref@@":-2}}}}' ;
		
		var a = {
			k1: 1,
			k2: 2
		} ;
		
		var b = {
			k4: 1,
			k5: 2
		} ;
		
		a.k3 = b ;
		b.k6 = a ;
		
		var o = {
			a: a,
			b: b
		} ;
		
		var aParsed = parse( aJson ) ;
		expect( aParsed ).to.only.have.keys( [ 'k1' , 'k2' , 'k3' ] ) ;
		expect( aParsed.k1 ).to.be( 1 ) ;
		expect( aParsed.k2 ).to.be( 2 ) ;
		expect( aParsed.k3 ).to.only.have.keys( [ 'k4' , 'k5' , 'k6' ] ) ;
		expect( aParsed.k3.k4 ).to.be( 1 ) ;
		expect( aParsed.k3.k5 ).to.be( 2 ) ;
		expect( aParsed.k3.k6 ).to.be( aParsed ) ;
		
		var oParsed = parse( oJson ) ;
		expect( oParsed ).to.only.have.keys( [ 'a' , 'b' ] ) ;
		expect( oParsed.a ).to.only.have.keys( [ 'k1' , 'k2' , 'k3' ] ) ;
		expect( oParsed.a.k1 ).to.be( 1 ) ;
		expect( oParsed.a.k2 ).to.be( 2 ) ;
		expect( oParsed.b ).to.only.have.keys( [ 'k4' , 'k5' , 'k6' ] ) ;
		expect( oParsed.b.k4 ).to.be( 1 ) ;
		expect( oParsed.b.k5 ).to.be( 2 ) ;
		expect( oParsed.a.k3.k6 ).to.be( oParsed.a ) ;
		expect( oParsed.b.k6.k3 ).to.be( oParsed.b ) ;
	} ) ;
	
	it( "unique ref notation" , function() {
		
		var parse = json.parser( { refNotation: true } ) ;
		
		var aJson = '{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"@@ref@@":[]}}}' ;
		var oJson = '{"a":{"k1":1,"k2":2,"k3":{"k4":1,"k5":2,"k6":{"@@ref@@":["a"]}}},"b":{"@@ref@@":["a","k3"]}}' ;
		
		var a = {
			k1: 1,
			k2: 2
		} ;
		
		var b = {
			k4: 1,
			k5: 2
		} ;
		
		a.k3 = b ;
		b.k6 = a ;
		
		var o = {
			a: a,
			b: b
		} ;
		
		var aParsed = parse( aJson ) ;
		//console.log( '\n\naParsed:' , aParsed ) ;
		expect( aParsed ).to.only.have.keys( [ 'k1' , 'k2' , 'k3' ] ) ;
		expect( aParsed.k1 ).to.be( 1 ) ;
		expect( aParsed.k2 ).to.be( 2 ) ;
		expect( aParsed.k3 ).to.only.have.keys( [ 'k4' , 'k5' , 'k6' ] ) ;
		expect( aParsed.k3.k4 ).to.be( 1 ) ;
		expect( aParsed.k3.k5 ).to.be( 2 ) ;
		expect( aParsed.k3.k6 ).to.be( aParsed ) ;
		
		//console.log( "\n\n" ) ;
		
		var oParsed = parse( oJson ) ;
		//console.log( '\n\noParsed:' , oParsed ) ;
		expect( oParsed ).to.only.have.keys( [ 'a' , 'b' ] ) ;
		expect( oParsed.a ).to.only.have.keys( [ 'k1' , 'k2' , 'k3' ] ) ;
		expect( oParsed.a.k1 ).to.be( 1 ) ;
		expect( oParsed.a.k2 ).to.be( 2 ) ;
		expect( oParsed.b ).to.only.have.keys( [ 'k4' , 'k5' , 'k6' ] ) ;
		expect( oParsed.b.k4 ).to.be( 1 ) ;
		expect( oParsed.b.k5 ).to.be( 2 ) ;
		expect( oParsed.a.k3.k6 ).to.be( oParsed.a ) ;
		expect( oParsed.b.k6.k3 ).to.be( oParsed.b ) ;
		
		expect( oParsed.a.k3 ).to.be( oParsed.b ) ;
		expect( oParsed.b.k6 ).to.be( oParsed.a ) ;
	} ) ;
} ) ;



describe( "JSON stringify + parse with the ref notation" , function() {
	
	it( "big test" , function() {
		
		var stringify = json.stringifier( { uniqueRefNotation: true } ) ;
		var parse = json.parser( { refNotation: true } ) ;
		
		var sample = require( '../sample/sample1.json' ) ;
		var sampleJson = JSON.stringify( sample ) ;
		
		var o = {
			a: sample ,
			b: {
				c: "some data",
				d: sample
			} ,
			e: "some data",
			f: {
				g: [ "some data" , sample , "some data" , sample ]
			}
		} ;
		
		var json1 = stringify( o ) ;
		
		expect( json1 ).to.be(
			'{"a":' + sampleJson + ',"b":{"c":"some data","d":{"@@ref@@":["a"]}},"e":"some data","f":{"g":["some data",{"@@ref@@":["a"]},"some data",{"@@ref@@":["a"]}]}}'
		) ;
		
		var r = parse( json1 ) ;
		expect( r ).to.eql( o ) ;
		expect( r.b.d ).to.be( r.a ) ;
		expect( r.f.g[ 1 ] ).to.be( r.a ) ;
		expect( r.f.g[ 3 ] ).to.be( r.a ) ;
		
		
		// Test ref to an array
		o = {
			a: [ "one" , 2 , sample , 4 , sample ] ,
			b: {
				c: "some data",
				d: sample
			} ,
			e: "some data",
			f: {
				g: [ "some data" , sample , "some data" , sample ]
			}
		} ;
		
		var json2 = stringify( o ) ;
		
		expect( json2 ).to.be(
			'{"a":["one",2,' + sampleJson + ',4,{"@@ref@@":["a",2]}],"b":{"c":"some data","d":{"@@ref@@":["a",2]}},"e":"some data","f":{"g":["some data",{"@@ref@@":["a",2]},"some data",{"@@ref@@":["a",2]}]}}'
		) ;
		
		r = parse( json2 ) ;
		expect( r ).to.eql( o ) ;
		expect( r.a[ 2 ] ).to.be( r.b.d ) ;
		expect( r.a[ 4 ] ).to.be( r.b.d ) ;
		expect( r.f.g[ 1 ] ).to.be( r.b.d ) ;
		expect( r.f.g[ 3 ] ).to.be( r.b.d ) ;
	} ) ;
} ) ;



describe( "stringifyStream()" , function() {
	
	it( "empty input stream should output a stream of an empty array" , function( done ) {
		
		var stringify = json.stringifier( {} ) ;
		var stream = json.stringifyStream( { stringifier: stringify } ) ;
		var str = '' ;
		
		stream.on( 'data' , function( data ) {
			str += data.toString() ;
		} ) ;
		
		stream.on( 'end' , function( data ) {
			expect( str ).to.be( '[]' ) ;
			done() ;
		} ) ;
		
		stream.end() ;
	} ) ;
	
	it( "when the input stream push some object, the output stream should push an array of object" , function( done ) {
		
		var stringify = json.stringifier( {} ) ;
		var stream = json.stringifyStream( { stringifier: stringify } ) ;
		var str = '' ;
		
		stream.on( 'data' , function( data ) {
			str += data.toString() ;
		} ) ;
		
		stream.on( 'end' , function( data ) {
			expect( str ).to.be( '[{"a":1,"b":2,"c":"C"},{"toto":"titi"}]' ) ;
			done() ;
		} ) ;
		
		stream.write( { a: 1 , b: 2 , c: 'C' } ) ;
		stream.write( { toto: "titi" } ) ;
		stream.end() ;
	} ) ;
} ) ;



describe( "parseStream()" , function() {
	
	it( 'empty stream (i.e.: "[]")' , function( done ) {
		
		var parse = json.parser( {} ) ;
		var stream = json.parseStream( { parser: parse } ) ;
		var array = [] ;
		
		stream.on( 'data' , function( data ) {
			//console( "Received " + ( typeof data ) + ':' , data ) ;
			array.push( data ) ;
		} ) ;
		
		stream.on( 'end' , function( data ) {
			expect( array ).to.eql( [] ) ;
			//console.log( '\n\n>>>>> DONE!\n\n' ) ;
			done() ;
		} ) ;
		
		stream.write( '[]' ) ;
		stream.end() ;
	} ) ;
	
	it( "single object in one write" , function( done ) {
		
		var parse = json.parser( {} ) ;
		var stream = json.parseStream( { parser: parse } ) ;
		var array = [] ;
		
		stream.on( 'data' , function( data ) {
			//console( "Received " + ( typeof data ) + ':' , data ) ;
			array.push( data ) ;
		} ) ;
		
		stream.on( 'end' , function( data ) {
			expect( array ).to.eql( [
				{ a: 1, b: 2, c: 'C' }
			] ) ;
			//console.log( '\n\n>>>>> DONE!\n\n' ) ;
			done() ;
		} ) ;
		
		stream.write( '[ { "a": 1 , "b": 2 , "c": "C" } ]' ) ;
		stream.end() ;
	} ) ;
	
	it( "single string in one write" , function( done ) {
		
		var parse = json.parser( {} ) ;
		var stream = json.parseStream( { parser: parse } ) ;
		var array = [] ;
		
		stream.on( 'data' , function( data ) {
			//console( "Received " + ( typeof data ) + ':' , data ) ;
			array.push( data ) ;
		} ) ;
		
		stream.on( 'end' , function( data ) {
			expect( array ).to.eql( [ "nasty string, with comma, inside" ] ) ;
			//console.log( '\n\n>>>>> DONE!\n\n' ) ;
			done() ;
		} ) ;
		
		stream.write( '[ "nasty string, with comma, inside" ]' ) ;
		stream.end() ;
	} ) ;
	
	it( "single object in two write" , function( done ) {
		
		var parse = json.parser( {} ) ;
		var stream = json.parseStream( { parser: parse } ) ;
		var array = [] ;
		
		stream.on( 'data' , function( data ) {
			//console( "Received " + ( typeof data ) + ':' , data ) ;
			array.push( data ) ;
		} ) ;
		
		stream.on( 'end' , function( data ) {
			expect( array ).to.eql( [
				{ a: 1, b: 2, c: 'C' }
			] ) ;
			//console.log( '\n\n>>>>> DONE!\n\n' ) ;
			done() ;
		} ) ;
		
		stream.write( '[ { "a": 1 , "b' ) ;
		stream.write( '": 2 , "c": "C" } ]' ) ;
		stream.end() ;
	} ) ;
	
	it( "single object in multiple write" , function( done ) {
		
		var parse = json.parser( {} ) ;
		var stream = json.parseStream( { parser: parse } ) ;
		var array = [] ;
		
		stream.on( 'data' , function( data ) {
			//console( "Received " + ( typeof data ) + ':' , data ) ;
			array.push( data ) ;
		} ) ;
		
		stream.on( 'end' , function( data ) {
			expect( array ).to.eql( [
				{ a: 1, b: 2, c: 'C' }
			] ) ;
			//console.log( '\n\n>>>>> DONE!\n\n' ) ;
			done() ;
		} ) ;
		
		stream.write( '   ' ) ;
		stream.write( '  \n ' ) ;
		stream.write( '  \n [ ' ) ;
		stream.write( '{ "a": ' ) ;
		stream.write( ' 1 , "b' ) ;
		stream.write( '": 2 , "' ) ;
		stream.write( 'c": "C" }' ) ;
		stream.write( '  ] ' ) ;
		stream.write( '  ' ) ;
		stream.end() ;
	} ) ;
	
	it( "multiple objects in one write" , function( done ) {
		
		var parse = json.parser( {} ) ;
		var stream = json.parseStream( { parser: parse } ) ;
		var array = [] ;
		
		stream.on( 'data' , function( data ) {
			//console( "Received " + ( typeof data ) + ':' , data ) ;
			array.push( data ) ;
		} ) ;
		
		stream.on( 'end' , function( data ) {
			expect( array ).to.eql( [
				{ a: 1, b: 2, c: 'C' } ,
				{ one: 1 } ,
				[ "two" , "three" ] ,
				true ,
				false ,
				undefined
			] ) ;
			//console.log( '\n\n>>>>> DONE!\n\n' ) ;
			done() ;
		} ) ;
		
		stream.write( '[{"a":1,"b":2,"c":"C"},{"one":1},[ "two" , "three" ] , true , false , null ]' ) ;
		stream.end() ;
	} ) ;
	
	it( "multiple objects in many write" , function( done ) {
		
		var parse = json.parser( {} ) ;
		var stream = json.parseStream( { parser: parse } ) ;
		var array = [] ;
		
		stream.on( 'data' , function( data ) {
			//console( "Received " + ( typeof data ) + ':' , data ) ;
			array.push( data ) ;
		} ) ;
		
		stream.on( 'end' , function( data ) {
			expect( array ).to.eql( [
				{ a: 1, b: 2, c: 'C' } ,
				{ one: 1 } ,
				[ "two" , "three" ] ,
				true ,
				false ,
				undefined
			] ) ;
			//console.log( '\n\n>>>>> DONE!\n\n' ) ;
			done() ;
		} ) ;
		
		stream.write( '   ' ) ;
		stream.write( '  \n ' ) ;
		stream.write( '  \n [{ ' ) ;
		stream.write( '"a":1' ) ;
		stream.write( ',"b":2,' ) ;
		stream.write( '"c":"C"}' ) ;
		stream.write( ',' ) ;
		stream.write( '{"one":1},[ "tw' ) ;
		stream.write( 'o" , "thr' ) ;
		stream.write( 'ee" ] , tr' ) ;
		stream.write( 'ue , false , ' ) ;
		stream.write( 'n' ) ;
		stream.write( 'u' ) ;
		stream.write( 'll ]' ) ;
		stream.write( ' \n ' ) ;
		stream.end() ;
	} ) ;
	
	it( "multiple objects in many write with nasty strings" , function( done ) {
		
		var parse = json.parser( {} ) ;
		var stream = json.parseStream( { parser: parse } ) ;
		var array = [] ;
		
		stream.on( 'data' , function( data ) {
			//console( "Received " + ( typeof data ) + ':' , data ) ;
			array.push( data ) ;
		} ) ;
		
		stream.on( 'end' , function( data ) {
			expect( array ).to.eql( [
				{ a: '  "  }  ', b: 2, c: '  C{[' } ,
				{ one: 1 } ,
				[ '  tw"}"}o' , '\\"thr\\ee\n' ] ,
				true ,
				false ,
				undefined
			] ) ;
			//console.log( '\n\n>>>>> DONE!\n\n' ) ;
			done() ;
		} ) ;
		
		stream.write( '   ' ) ;
		stream.write( '  \n ' ) ;
		stream.write( '  \n [{ ' ) ;
		stream.write( '"a":"  \\"  }  "' ) ;
		stream.write( ',"b":2,' ) ;
		stream.write( '"c":"  C{["}' ) ;
		stream.write( ',' ) ;
		stream.write( '{"one":1},[ "  tw\\"}' ) ;
		stream.write( '\\"}o" , "\\\\\\"thr\\\\' ) ;
		stream.write( 'ee\\n" ] , tr' ) ;
		stream.write( 'ue , false , ' ) ;
		stream.write( 'n' ) ;
		stream.write( 'u' ) ;
		stream.write( 'll ]' ) ;
		stream.write( ' \n ' ) ;
		stream.end() ;
	} ) ;
} ) ;


