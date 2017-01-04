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
var ClassMap = jsbindat.ClassMap ;
//var expect = require( 'expect.js' ) ;
var doormen = require( 'doormen' ) ;
var async = require( 'async-kit' ) ;
var string = require( 'string-kit' ) ;





			/* Helpers */



function mutualTest( originalData , serializerOptions , unserializerOptions , extraTestCb , done )
{
	// Manage arguments
	if ( typeof serializerOptions === 'function' )
	{
		if ( typeof unserializerOptions === 'function' )
		{
			extraTestCb = serializerOptions ;
			done = unserializerOptions ;
			serializerOptions = null ;
			unserializerOptions = null ;
		}
		else
		{
			done = serializerOptions ;
			extraTestCb = null ;
			serializerOptions = null ;
			unserializerOptions = null ;
		}
	}
	else if ( ! done )
	{
		done = extraTestCb ;
		extraTestCb = null ;
	}
	
	jsbindat.writeFile( __dirname + '/out.jsdat' , originalData , serializerOptions , function() {
			
		jsbindat.readFile( __dirname + '/out.jsdat' , unserializerOptions , function( data ) {
			
			//console.log( '\n\n>>> data:' , data , '\n\n' ) ;
			//try {
			doormen.equals( data , originalData ) ;
			
			if ( originalData && typeof originalData === 'object' )
			{
				//console.log( Object.getPrototypeOf( data ).constructor.name ) ;
				//console.log( data ) ;
				doormen.equals( Object.getPrototypeOf( data ) === Object.getPrototypeOf( originalData ) , true ) ;
			}
			
			//} catch ( error ) { console.log( data ) ; throw error ; }
			
			if ( typeof extraTestCb === 'function' ) { extraTestCb( data ) ; }
			
			done() ;
		} ) ;
	} ) ;
}



function deb( v )
{
	return string.inspect( { style: 'color' } , v ) ;
}





			/* Tests */



describe( "basic serialization/unserialization features" , function() {
	
	it( "undefined" , function( done ) {
		mutualTest( undefined , done ) ;
	} ) ;
	
	it( "null" , function( done ) {
		mutualTest( null , done ) ;
	} ) ;
	
	it( "false" , function( done ) {
		mutualTest( false , done ) ;
	} ) ;
	
	it( "true" , function( done ) {
		mutualTest( true , done ) ;
	} ) ;
	
	it( "numbers" , function( done ) {
		
		var samples = [
			0 , 1 , 123 , 123456789 , 0.123 , 123.456 , -1 , -123456789 , -0.123 , -123.456 ,
			Infinity , -Infinity , NaN ] ;
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "strings" , function( done ) {
		
		var samples = [
			'' ,
			'a' ,
			'a string' ,
			'a'.repeat( 32 ) ,
			'a'.repeat( 64 ) ,
			'a'.repeat( 128 ) ,
			'a'.repeat( 256 ) ,
			'a'.repeat( 512 ) ,
			'this is a really really really big big big string!'.repeat( 100 ) ,
			'this is a really really really big big big string!'.repeat( 2000 ) ,
			'this is a really really really big big big string!'.repeat( 200000 ) ,
		] ;
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "arrays" , function( done ) {
		
		var samples = [
			[] ,
			[ true , false ] ,
			[ 1 , 2 , 3 , true , false , null , 'a string' , 'another string' ]
		] ;
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "ES6 Set" , function( done ) {
		
		var set = new Set() ;
		
		set.add( { a: 1 } ) ;
		set.add( { b: 2 } ) ;
		
		var samples = [ new Set() , set ] ;
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "nested arrays" , function( done ) {
		
		var samples = [
			[
				[ 1 , 2 , 3 ] ,
				[ true , false ] ,
				[ null , 'another string' , 'this is a really really really big big big string!'.repeat( 100 ) , 'a string' ]
			]
		] ;
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "objects" , function( done ) {
		
		var big = 'this is a really really really big big big string!'.repeat( 100 ) ;
		
		var samples = [
			{} ,
			{ a: 1 , b: 2 } ,
			{ a: 1 , b: 2 , c: true , d: 'a string' , f: 'big' , abcdefghijklmnopq: true , g: 'gee' } ,
			{ a: 1 , b: 2 , c: true , d: 'a string' , f: big , abcdefghijklmnopq: true , g: 'gee' }
		] ;
		
		// Big key
		samples[ samples.length - 1 ][ big ] = big ;
		samples[ samples.length - 1 ].notbig = 'notbigstring' ;
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "nested objects" , function( done ) {
		
		var samples = [
			{
				sub: { a: 1, sub: {} } ,
				sub2: { b: 2, sub: { sub: { sub: { c: 3 } } } } ,
				d: 4
			}
		] ;
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "nested arrays and objects" , function( done ) {
		
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
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "real-world test" , function( done ) {
		
		mutualTest( require( '../sample/sample1.json' ) , done ) ;
	} ) ;
} ) ;



describe( "Instances" , function() {
	
	it( "instances without constructor" , function( done ) {
		
		function ZeClass()
		{
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: new ClassMap( {
				ZeClass: {
					prototype: ZeClass.prototype
				}
			} )
		} ;
		
		var data = {
			v: new ZeClass()
		} ;
		
		//console.log( 'data: ' , data ) ;
		
		mutualTest( data , options , options , function( udata ) {
			//console.log( 'udata: ' , udata ) ;
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} , done ) ;
	} ) ;
	
	it( "constructed instances, using a 'new' type of constructor" , function( done ) {
		
		function ZeClass()
		{
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: ClassMap.create( {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) {
						return [ undefined , obj ] ;
					} ,
					newConstructor: ZeClass
				}
			} )
		} ;
		
		var data = {
			v: new ZeClass() ,
			v2: new ZeClass()
		} ;
		
		data.v2.inc() ;
		
		//console.log( 'data: ' , deb( data ) ) ;
		
		mutualTest( data , options , options , function( udata ) {
			//console.log( 'udata: ' , deb( udata ) ) ;
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} , done ) ;
	} ) ;
	
	it( "constructed instances, using a 'new' type of constructor with arguments" , function( done ) {
		
		function ZeClass( arg1 , arg2 )
		{
			this.arg1 = arg1 ;
			this.arg2 = arg2 ;
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: ClassMap.create( {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) {
						return [ [ obj.arg1 , obj.arg2 ] , { a: obj.a , b: obj.b } ] ;
					} ,
					newConstructor: ZeClass
				}
			} )
		} ;
		
		var data = {
			v: new ZeClass( "arg1" , 2 ) ,
			v2: new ZeClass( { arg: 1 } , [ 2 ] )
		} ;
		
		data.v2.inc() ;
		
		//console.log( 'data: ' , deb( data ) ) ;
		
		mutualTest( data , options , options , function( udata ) {
			//console.log( 'udata: ' , deb( udata ) ) ;
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} , done ) ;
	} ) ;
	
	it( "constructed instances, using a regular function as constructor" , function( done ) {
		
		function ZeClass()
		{
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: ClassMap.create( {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) {
						return [ undefined , obj ] ;
					} ,
					constructor: function() { return new ZeClass() ; }
				}
			} )
		} ;
		
		var data = {
			v: new ZeClass() ,
			v2: new ZeClass()
		} ;
		
		data.v2.inc() ;
		
		//console.log( 'data: ' , deb( data ) ) ;
		
		mutualTest( data , options , options , function( udata ) {
			//console.log( 'udata: ' , deb( udata ) ) ;
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} , done ) ;
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
			classMap: ClassMap.create( {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) {
						return [ [ obj.arg1 , obj.arg2 ] , { a: obj.a , b: obj.b } ] ;
					} ,
					constructor: function( arg1 , arg2 ) { return new ZeClass( arg1 , arg2 ) ; }
				}
			} )
		} ;
		
		var data = {
			v: new ZeClass( "arg1" , 2 ) ,
			v2: new ZeClass( { arg: 1 } , [ 2 ] )
		} ;
		
		data.v2.inc() ;
		
		//console.log( 'data: ' , deb( data ) ) ;
		
		mutualTest( data , options , options , function( udata ) {
			//console.log( 'udata: ' , deb( udata ) ) ;
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} , done ) ;
	} ) ;
	
	it( "constructed instances, test the Date object" , function( done ) {
		
		var options = {
			classMap: ClassMap.create( {
				Date: {
					prototype: Date.prototype ,
					constructor: function( arg ) {
						return new Date( arg ) ;
					} ,
					serializer: function( value ) {
						return [ value.getTime() ] ;
					}
				}
			} )
		} ;
		
		var samples = [
			new Date() ,
			[ new Date() , new Date() , new Date() ] ,
			{ a: new Date() , b: new Date() , c: new Date() } ,
		] ;
		
		//console.log( 'samples: ' , deb( samples ) ) ;
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , options , options , function( udata ) {
				//console.log( 'udata: ' , deb( udata ) ) ;
			} , foreachCallback ) ;
		} )
		.exec( done ) ;
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
		} , done ) ;
	} ) ;
	
	it( "instances without constructor self referencing itself and other instances" , function( done ) {
		
		function ZeClass()
		{
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: ClassMap.create( {
				ZeClass: {
					prototype: ZeClass.prototype
				}
			} )
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
		
		//console.log( 'data: ' , deb( data ) ) ;
		
		mutualTest( data , options , options , function( udata ) {
			//console.log( 'udata: ' , deb( udata ) ) ;
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
			doormen.equals( udata.v.root === udata , true ) ;
			doormen.equals( udata.v.self === udata.v , true ) ;
			doormen.equals( udata.v.v2 === udata.v2 , true ) ;
			doormen.equals( udata.v2.v === udata.v , true ) ;
			doormen.equals( udata.v3 === udata.v2 , true ) ;
		} , done ) ;
	} ) ;
	
	it( "instances with constructor self referencing itself and other instances" , function( done ) {
		
		function ZeClass()
		{
			this.a = 4 ;
			this.b = 7 ;
		}
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }
		
		var options = {
			classMap: ClassMap.create( {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) {
						
						// Back up anything except constructor args
						var clone = Object.assign( {} , obj ) ;
						delete clone.arg1 ;
						delete clone.arg2 ;
						
						return [ [ obj.arg1 , obj.arg2 ] , clone ] ;
					} ,
					constructor: function( arg1 , arg2 ) { return new ZeClass( arg1 , arg2 ) ; }
				}
			} )
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
		
		//console.log( 'data: ' , deb( data ) ) ;
		
		mutualTest( data , options , options , function( udata ) {
			//console.log( 'udata: ' , deb( udata ) ) ;
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
			doormen.equals( udata.v.root === udata , true ) ;
			doormen.equals( udata.v.self === udata.v , true ) ;
			doormen.equals( udata.v.v2 === udata.v2 , true ) ;
			doormen.equals( udata.v2.v === udata.v , true ) ;
			doormen.equals( udata.v3 === udata.v2 , true ) ;
		} , done ) ;
	} ) ;
} ) ;


