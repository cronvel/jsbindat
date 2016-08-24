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



function mutualTest( originalData , done )
{
	var serialize = jsbindat.serializer( {} ) ;
	var unserialize = jsbindat.unserializer( {} ) ;
	
	var stream = fs.createWriteStream( __dirname + '/out.jsdat' ) ;
	//serialize( undefined , stream ) ;
	
	serialize( originalData , stream , function() {
		stream.end( function() {
			
			var stream = fs.createReadStream( __dirname + '/out.jsdat' ) ;
			
			unserialize( stream , function( data ) {
				console.log( '\n\n>>> data:' , data , '\n\n' ) ;
				doormen.equals( data , originalData ) ;
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
		
		async.foreach( samples , function( str , foreachCallback ) {
			mutualTest( str , foreachCallback ) ;
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
		
		async.foreach( samples , function( str , foreachCallback ) {
			mutualTest( str , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "arrays" , function( done ) {
		
		var samples = [
			[] ,
			[ true , false ] ,
			[ 1 , 2 , 3 , true , false , null , 'a string' , 'another string' ]
		] ;
		
		async.foreach( samples , function( str , foreachCallback ) {
			mutualTest( str , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "nested arrays" , function( done ) {
		
		var samples = [
			[ [ 1 , 2 , 3 ] , [ true , false ] , [ null , 'a string' , 'another string' ] ]
		] ;
		
		async.foreach( samples , function( str , foreachCallback ) {
			mutualTest( str , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
	it( "objects" , function( done ) {
		
		var samples = [
			{} ,
		] ;
		
		async.foreach( samples , function( str , foreachCallback ) {
			mutualTest( str , foreachCallback ) ;
		} )
		.exec( done ) ;
	} ) ;
	
} ) ;



