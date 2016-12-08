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
//var expect = require( 'expect.js' ) ;
var doormen = require( 'doormen' ) ;
var async = require( 'async-kit' ) ;





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
	
	var stream = fs.createWriteStream( __dirname + '/out.jsdat' ) ;
	//serialize( undefined , stream ) ;
	
	jsbindat.serialize( originalData , stream , serializerOptions , function() {
		stream.end( function() {
			
			//console.log( '>>> Serialized!' ) ;
			var stream = fs.createReadStream( __dirname + '/out.jsdat' ) ;
			
			jsbindat.unserialize( stream , unserializerOptions , function( data ) {
				//console.log( '\n\n>>> data:' , data , '\n\n' ) ;
				//try {
				doormen.equals( data , originalData ) ;
				//} catch ( error ) { console.log( data ) ; throw error ; }
				
				if ( typeof extraTestCb === 'function' ) { extraTestCb( data ) ; }
				
				done() ;
			} ) ;
		} ) ;
	} ) ;
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
} ) ;



describe( "Instances" , function() {
	
	it( "instances" , function( done ) {
		
		var options = {
			classes: {
				Date: {
					prototype: Date.prototype ,
					constructor: function( arg ) {
						return new Date( arg ) ;
					} ,
					serializer: function( value ) {
						return [ value.getTime() ] ;
					}
				}
			}
		} ;
		
		var samples = [
			new Date() ,
			[ new Date() , new Date() , new Date() ] ,
			{ a: new Date() , b: new Date() , c: new Date() } ,
		] ;
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , options , options , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "instances using an object as argument" , function( done ) {
		
		var serializerOptions = {
			classes: new Map()
		} ;
		
		serializerOptions.classes.set( Date.prototype , function Date( v ) {
			return {
				timestamp: v.getTime() ,
				string: v.toString() ,
			} ;
		} ) ;
		
		var unserializerOptions = {
			classes: {
				Date: function( v ) {
					return new Date( v.timestamp ) ;
				}
			}
		} ;
		
		var samples = [
			new Date() ,
			[ new Date() , new Date() , new Date() ] ,
			{ a: new Date() , b: new Date() , c: new Date() } ,
		] ;
		
		async.foreach( samples , function( data , foreachCallback ) {
			mutualTest( data , serializerOptions , unserializerOptions , foreachCallback ) ;
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
} ) ;


