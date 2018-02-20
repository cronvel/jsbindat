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
var jsbindat = require( '../lib/jsbindat.js' ) ;
var ClassMap = jsbindat.ClassMap ;
//var expect = require( 'expect.js' ) ;
var doormen = require( 'doormen' ) ;
var Promise = require( 'seventh' ) ;
var string = require( 'string-kit' ) ;





			/* Helpers */



function deb( title , v ) {
	if ( arguments.length < 2 ) {
		v = title ;
		title = null ;
	}
	
	console.log( 
		( title ? title + ': ' : '' ) +
		string.inspect( { style: 'color' , depth: 5 } , v )
	) ;
}



async function mutualTest( originalData , serializerOptions , unserializerOptions , extraTestCb ) {
	var data ;
	
	// Manage arguments
	if ( typeof serializerOptions === 'function' )
	{
		if ( typeof unserializerOptions === 'function' )
		{
			extraTestCb = serializerOptions ;
			serializerOptions = null ;
			unserializerOptions = null ;
		}
		else
		{
			extraTestCb = null ;
			serializerOptions = null ;
			unserializerOptions = null ;
		}
	}
	
	try {
		await jsbindat.writeFile( __dirname + '/out.jsdat' , originalData , serializerOptions ) ;
		
		data = await jsbindat.readFile( __dirname + '/out.jsdat' , unserializerOptions ) ;
		//deb( 'data' , data ) ;
		
		doormen.equals( data , originalData ) ;
		
		if ( originalData && typeof originalData === 'object' )
		{
			//console.log( Object.getPrototypeOf( data ).constructor.name ) ;
			//console.log( data ) ;
			doormen.equals( Object.getPrototypeOf( data ) === Object.getPrototypeOf( originalData ) , true ) ;
		}
		
	}
	catch ( error ) {
		//console.log( "Error!" , error ) ;
		//deb( "Input data" , originalData ) ;
		//deb( "Output data" , data ) ;
		throw error ;
		return ;
	}
	
	if ( typeof extraTestCb === 'function' ) { extraTestCb( data ) ; }
}





			/* Tests */



describe( "basic serialization/unserialization features" , function() {
	
	it( "undefined" , function( done ) {
		mutualTest( undefined ).then( done , done ) ;
	} ) ;
	
	it( "null" , function( done ) {
		mutualTest( null ).then( done , done ) ;
	} ) ;
	
	it( "false" , function( done ) {
		mutualTest( false ).then( done , done ) ;
	} ) ;
	
	it( "true" , function( done ) {
		mutualTest( true ).then( done , done ) ;
	} ) ;
	
	it( "numbers" , async function( done ) {
		
		try {
			await mutualTest( 0 ) ;
			await mutualTest( 1 ) ;
			await mutualTest( 123 ) ;
			await mutualTest( 123456789 ) ;
			await mutualTest( 0.123 ) ;
			await mutualTest( 123.456 ) ;
			await mutualTest( -1 ) ;
			await mutualTest( -123456789 ) ;
			await mutualTest( -0.123 ) ;
			await mutualTest( -123.456 ) ;
			await mutualTest( NaN ) ;
			await mutualTest( Infinity ) ;
			await mutualTest( -Infinity ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
	
	it( "strings" , async function( done ) {
		
		try {
			await mutualTest( '' ) ;
			await mutualTest( 'a' ) ;
			await mutualTest( 'a string' ) ;
			await mutualTest( 'a'.repeat( 32 ) ) ;
			//*
			await mutualTest( 'a'.repeat( 64 ) ) ;
			await mutualTest( 'a'.repeat( 128 ) ) ;
			await mutualTest( 'a'.repeat( 256 ) ) ;
			await mutualTest( 'a'.repeat( 512 ) ) ;
			await mutualTest( 'this is a really really really big big big string!'.repeat( 100 ) ) ;
			await mutualTest( 'this is a really really really big big big string!'.repeat( 2000 ) ) ;
			await mutualTest( 'this is a really really really big big big string!'.repeat( 200000 ) ) ;
			//*/
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
	
	it( "arrays" , async function( done ) {
		
		try {
			await mutualTest( [] ) ;
			await mutualTest( [ true , false ] ) ;
			await mutualTest( [ 1 , 2 , 3 , true , false , null , 'a string' , 'another string' ] ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
	
	it( "ES6 Set" , async function( done ) {
		
		var set ;
		
		try {
			await mutualTest( new Set() ) ;
			
			set = new Set() ;
			set.add( 1 ) ;
			set.add( "bob" ) ;
			await mutualTest( set ) ;
			
			set = new Set() ;
			set.add( { a: 1 } ) ;
			set.add( { b: 2 } ) ;
			//await mutualTest( set ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
	
	it( "nested arrays" , async function( done ) {
		
		try {
			await mutualTest( [
				[ 1 , 2 , 3 ] ,
				[ true , false ] ,
				[ null , 'another string' , 'this is a really really really big big big string!'.repeat( 100 ) , 'a string' ]
			] ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
	
	it( "objects" , async function( done ) {
		
		var big = 'this is a really really really big big big string!'.repeat( 100 ) ;
		
		var bigKeyObject = { a: 1 , b: 2 , c: true , d: 'a string' , f: big , abcdefghijklmnopq: true , g: 'gee' } ;
		bigKeyObject[ big ] = big ;
		bigKeyObject.notbig = 'notbigstring' ;
		
		try {
			await mutualTest( {} ) ;
			await mutualTest( { a: 1 , b: 2 } ) ;
			await mutualTest( { a: 1 , b: 2 , c: true , d: 'a string' , f: 'big' , abcdefghijklmnopq: true , g: 'gee' } ) ;
			await mutualTest( bigKeyObject ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
	
	it( "nested objects" , async function( done ) {
		
		try {
			await mutualTest( {
				sub: { a: 1, sub: {} } ,
				sub2: { b: 2, sub: { sub: { sub: { c: 3 } } } } ,
				d: 4
			} ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
	
	it( "nested arrays and objects" , async function( done ) {
		
		var samples = [
			{
				sub: [ 1, {} ] ,
				sub2: [ 2, { sub: { sub: { c: [ 1 , 2 , 3 ] } } } ] ,
				d: 4
			} ,
			[
				[ 1, {} ] ,
				{ b: 2, sub: { sub: { sub: { c: [ 1 , 2 , 3 ] } } } } ,
				4
			]
		] ;
		
		try {
			await mutualTest( {
				sub: [ 1, {} ] ,
				sub2: [ 2, { sub: { sub: { c: [ 1 , 2 , 3 ] } } } ] ,
				d: 4
			} ) ;
			await mutualTest( [
				[ 1, {} ] ,
				{ b: 2, sub: { sub: { sub: { c: [ 1 , 2 , 3 ] } } } } ,
				4
			] ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
	
	it( "real-world test" , function( done ) {
		
		mutualTest( require( '../sample/sample1.json' ) ).then( done , done ) ;
	} ) ;
} ) ;



describe( "Instances" , function() {
	
	it( "empty instances without constructor" , async function( done ) {
		
		function ZeClass() {}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: new ClassMap( {
				ZeClass: ZeClass
			} )
		} ;
		
		var data = {
			v: new ZeClass()
		} ;
		
		//console.log( 'data: ' , data ) ;
		
		mutualTest( data , options , options , udata => {
			//console.log( 'udata: ' , udata ) ;
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "instances without constructor" , async function( done ) {
		
		function ZeClass()
		{
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: {
				ZeClass: ZeClass
			}
		} ;
		
		var data = {
			v: new ZeClass()
		} ;
		
		//console.log( 'data: ' , data ) ;
		
		mutualTest( data , options , options , udata => {
			//console.log( 'udata: ' , udata ) ;
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "constructed instances, using a 'new' type of constructor" , function( done ) {
		
		function ZeClass()
		{
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.serializer = function( obj ) {
			return [ obj ] ;
		} ;
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: {
				ZeClass: ZeClass
			}
		} ;
		
		var data = {
			v: new ZeClass() ,
			v2: new ZeClass()
		} ;
		
		data.v2.inc() ;
		
		mutualTest( data , options , options , udata => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "constructed instances, using a 'new' type of constructor with arguments" , function( done ) {
		
		function ZeClass( arg1 , arg2 )
		{
			this.arg1 = arg1 ;
			this.arg2 = arg2 ;
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.serializer = function( obj ) {
			return [ obj.arg1 , obj.arg2 , { a: obj.a , b: obj.b } ] ;
		} ;
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: {
				ZeClass: ZeClass
			}
		} ;
		
		var data = {
			v: new ZeClass( "arg1" , 2 ) ,
			v2: new ZeClass( { arg: 1 } , [ 2 ] )
		} ;
		
		data.v2.inc() ;
		
		
		mutualTest( data , options , options , function( udata ) {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "constructed instances, using a regular function as constructor" , function( done ) {
		
		function ZeClass()
		{
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) { return [ obj ] ; } ,
					unserializer: function() { return new ZeClass() ; }
				}
			}
		} ;
		
		var data = {
			v: new ZeClass() ,
			v2: new ZeClass()
		} ;
		
		data.v2.inc() ;
		
		mutualTest( data , options , options , function( udata ) {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "constructed instances, using a regular function as constructor, with arguments" , function( done ) {
		
		function ZeClass( arg1 , arg2 )
		{
			this.arg1 = arg1 ;
			this.arg2 = arg2 ;
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) {
						return [ obj.arg1 , obj.arg2 , { a: obj.a , b: obj.b } ] ;
					} ,
					unserializer: function( arg1 , arg2 ) { return new ZeClass( arg1 , arg2 ) ; }
				}
			}
		} ;
		
		var data = {
			v: new ZeClass( "arg1" , 2 ) ,
			v2: new ZeClass( { arg: 1 } , [ 2 ] )
		} ;
		
		data.v2.inc() ;
		
		mutualTest( data , options , options , function( udata ) {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "constructed instances, test the Date object" , async function( done ) {
		
		var options = {
			classMap: {
				Date: {
					prototype: Date.prototype ,
					unserializer: function( arg ) {
						return new Date( arg ) ;
					} ,
					serializer: function( value ) {
						return [ value.getTime() , null ] ;
					}
				}
			}
		} ;
		
		try {
			await mutualTest( new Date() , options , options ) ;
			await mutualTest( [ new Date() , new Date() , new Date() ] , options , options ) ;
			await mutualTest( { a: new Date() , b: new Date() , c: new Date() } , options , options ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
} ) ;



describe( "References and relational structures" , function() {
	
	it( "references (no duplicated object)" , function( done ) {
		
		var data = {
			doc1: { a: 1, b: 2 } ,
			doc2: { a: 4, b: 7 } ,
			doc3: {} ,
			doc4: { mlinks:[] } ,
			doc5: {} ,
		} ;
		
		data.circular = data ;
		data.doc1.link = data.doc3 ;
		data.doc2.link = data.doc1 ;
		data.doc5.mlinks = [ data.doc1 , data.doc3 , data ] ;
		
		mutualTest( data , function( udata ) {
			doormen.equals( udata.circular === udata , true ) ;
			doormen.equals( udata.doc2.link === udata.doc1 , true ) ;
			doormen.equals( udata.doc2.link === udata.doc1 , true ) ;
			doormen.equals( udata.doc5.mlinks[ 0 ] === udata.doc1 , true ) ;
			doormen.equals( udata.doc5.mlinks[ 1 ] === udata.doc3 , true ) ;
			doormen.equals( udata.doc5.mlinks[ 2 ] === udata , true ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "instances without constructor self referencing itself and other instances" , function( done ) {
		
		function ZeClass()
		{
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: {
				ZeClass: ZeClass
			}
		} ;
		
		var data = {
			v: new ZeClass() ,
			v2: new ZeClass()
		} ;
		
		data.v2.inc() ;
		data.v.root = data ;
		data.v.self = data.v ;
		data.v.v2 = data.v2 ;
		data.v2.v = data.v ;
		data.v3 = data.v2 ;
		
		mutualTest( data , options , options , function( udata ) {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
			doormen.equals( udata.v.root === udata , true ) ;
			doormen.equals( udata.v.self === udata.v , true ) ;
			doormen.equals( udata.v.v2 === udata.v2 , true ) ;
			doormen.equals( udata.v2.v === udata.v , true ) ;
			doormen.equals( udata.v3 === udata.v2 , true ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "instances with constructor self referencing itself and other instances" , function( done ) {
		
		function ZeClass()
		{
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) {
						
						// Back up anything except constructor args
						var clone = Object.assign( {} , obj ) ;
						delete clone.arg1 ;
						delete clone.arg2 ;
						
						return [ obj.arg1 , obj.arg2 , clone ] ;
					} ,
					unserializer: function( arg1 , arg2 ) { return new ZeClass( arg1 , arg2 ) ; }
				}
			}
		} ;
		
		var data = {
			v: new ZeClass() ,
			v2: new ZeClass()
		} ;
		
		data.v2.inc() ;
		data.v.root = data ;
		data.v.self = data.v ;
		data.v.v2 = data.v2 ;
		data.v2.v = data.v ;
		data.v3 = data.v2 ;
		
		mutualTest( data , options , options , function( udata ) {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
			doormen.equals( udata.v.root === udata , true ) ;
			doormen.equals( udata.v.self === udata.v , true ) ;
			doormen.equals( udata.v.v2 === udata.v2 , true ) ;
			doormen.equals( udata.v2.v === udata.v , true ) ;
			doormen.equals( udata.v3 === udata.v2 , true ) ;
		} ).then( done , done ) ;
	} ) ;
} ) ;


