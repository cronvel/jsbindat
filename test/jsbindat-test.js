/*
	JS Binary Data
	
	Copyright (c) 2016 - 2018 Cédric Ronvel
	
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
		string.inspect( { style: 'color' , depth: 5 , proto: false } , v )
	) ;
}



async function mutualTest( originalData , serializerOptions , unserializerOptions , extraTestCb ) {
	var data ;

	// Manage arguments
	if ( typeof serializerOptions === 'function' ) {
		if ( typeof unserializerOptions === 'function' ) {
			extraTestCb = serializerOptions ;
			serializerOptions = null ;
			unserializerOptions = null ;
		}
		else {
			extraTestCb = null ;
			serializerOptions = null ;
			unserializerOptions = null ;
		}
	}

	try {
		await jsbindat.writeFile( __dirname + '/out.jsdat' , originalData , serializerOptions ) ;

		//console.log( 'before' ) ;
		data = await jsbindat.readFile( __dirname + '/out.jsdat' , unserializerOptions ) ;
		//console.log( 'after' ) ;
		//deb( 'data' , data ) ;

		doormen.equals( data , originalData ) ;

		if ( originalData && typeof originalData === 'object' ) {
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



describe( "basic serialization/unserialization features" , () => {

	it( "undefined" , ( done ) => {
		mutualTest( undefined ).then( done , done ) ;
	} ) ;

	it( "null" , ( done ) => {
		mutualTest( null ).then( done , done ) ;
	} ) ;

	it( "false" , ( done ) => {
		mutualTest( false ).then( done , done ) ;
	} ) ;

	it( "true" , ( done ) => {
		mutualTest( true ).then( done , done ) ;
	} ) ;

	it( "numbers" , async( done ) => {

		try {
			await mutualTest( 0 ) ;
			await mutualTest( 1 ) ;
			await mutualTest( -1 ) ;
			await mutualTest( 123 ) ;
			await mutualTest( 127 ) ;
			await mutualTest( 128 ) ;
			await mutualTest( -127 ) ;
			await mutualTest( -128 ) ;
			await mutualTest( 255 ) ;
			await mutualTest( 256 ) ;
			await mutualTest( 32767 ) ;
			await mutualTest( 32768 ) ;
			await mutualTest( 65535 ) ;
			await mutualTest( 65536 ) ;
			await mutualTest( -32768 ) ;
			await mutualTest( -32769 ) ;
			await mutualTest( 123456789 ) ;
			await mutualTest( 2147483647 ) ;
			await mutualTest( 2147483648 ) ;
			await mutualTest( 4294967295 ) ;
			await mutualTest( 4294967296 ) ;
			await mutualTest( -2147483648 ) ;
			await mutualTest( -2147483649 ) ;
			await mutualTest( 21474836480 ) ;
			await mutualTest( -21474836480 ) ;
			await mutualTest( 0.123 ) ;
			await mutualTest( 123.456 ) ;
			await mutualTest( -123456789 ) ;
			await mutualTest( -0.123 ) ;
			await mutualTest( -123.456 ) ;
			await mutualTest( 0.000000001 ) ;
			await mutualTest( -0.000000001 ) ;
			await mutualTest( Math.PI ) ;
			await mutualTest( -Math.PI ) ;
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

	it( "strings" , async( done ) => {

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

	it( "arrays" , async( done ) => {

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

	it( "ES6 Set" , async( done ) => {

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
			await mutualTest( set ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}

		done() ;
	} ) ;

	it( "nested arrays" , async( done ) => {

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

	it( "objects" , async( done ) => {

		var big = 'this is a really really really big big big string!'.repeat( 100 ) ;

		var bigKeyObject = {
			a: 1 , b: 2 , c: true , d: 'a string' , f: big , abcdefghijklmnopq: true , g: 'gee'
		} ;
		bigKeyObject[ big ] = big ;
		bigKeyObject.notbig = 'notbigstring' ;

		try {
			await mutualTest( {} ) ;
			await mutualTest( { a: 1 , b: 2 } ) ;
			await mutualTest( {
				a: 1 , b: 2 , c: true , d: 'a string' , f: 'big' , abcdefghijklmnopq: true , g: 'gee'
			} ) ;
			await mutualTest( bigKeyObject ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}

		done() ;
	} ) ;

	it( "nested objects" , async( done ) => {

		try {
			await mutualTest( {
				sub: { a: 1 , sub: {} } ,
				sub2: { b: 2 , sub: { sub: { sub: { c: 3 } } } } ,
				d: 4
			} ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}

		done() ;
	} ) ;

	it( "nested arrays and objects" , async( done ) => {

		var samples = [
			{
				sub: [ 1 , {} ] ,
				sub2: [ 2 , { sub: { sub: { c: [ 1 , 2 , 3 ] } } } ] ,
				d: 4
			} ,
			[
				[ 1 , {} ] ,
				{ b: 2 , sub: { sub: { sub: { c: [ 1 , 2 , 3 ] } } } } ,
				4
			]
		] ;

		try {
			await mutualTest( {
				sub: [ 1 , {} ] ,
				sub2: [ 2 , { sub: { sub: { c: [ 1 , 2 , 3 ] } } } ] ,
				d: 4
			} ) ;
			await mutualTest( [
				[ 1 , {} ] ,
				{ b: 2 , sub: { sub: { sub: { c: [ 1 , 2 , 3 ] } } } } ,
				4
			] ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}

		done() ;
	} ) ;

	it( "ES6 Map" , async( done ) => {

		var map ;

		try {
			await mutualTest( new Map() ) ;

			map = new Map() ;
			map.set( { jack: '2' } , 1 ) ;
			map.set( "bob" , "bill" ) ;
			map.set( { keyKey: 'value of key' } , { valueKey: 'value of value' } ) ;
			await mutualTest( map ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}

		done() ;
	} ) ;

	it( "Buffer" , async( done ) => {

		try {
			// Let allocUnsafe() create some garbage data...
			await mutualTest( Buffer.allocUnsafe( 10 ) ) ;
			await mutualTest( Buffer.allocUnsafe( 100 ) ) ;
			await mutualTest( Buffer.allocUnsafe( 1000000 ) ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}

		done() ;
	} ) ;

	it( "Object.prototype" , ( done ) => {
		mutualTest( Object.prototype , null , null , udata => {
			doormen.equals( udata === Object.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;

	it( "real-world test" , ( done ) => {

		mutualTest( require( '../sample/sample1.json' ) ).then( done , done ) ;
	} ) ;
} ) ;



describe( "Instances" , () => {

	it( "empty instances without constructor" , async( done ) => {

		function ZeClass() {}

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

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

	it( "instances without constructor" , async( done ) => {

		function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

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

	it( "constructed instances, using a 'new' type of constructor" , ( done ) => {

		function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}

		ZeClass.serializer = function( obj ) {
			return [ obj ] ;
		} ;

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

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

	it( "constructed instances, using a 'new' type of constructor with arguments" , ( done ) => {

		function ZeClass( arg1 , arg2 ) {
			this.arg1 = arg1 ;
			this.arg2 = arg2 ;
			this.a = 4 ;
			this.b = 7 ;
		}

		ZeClass.serializer = function( obj ) {
			return [ obj.arg1 , obj.arg2 , { a: obj.a , b: obj.b } ] ;
		} ;

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

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


		mutualTest( data , options , options , ( udata ) => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;

	it( "constructed instances, using a regular function as constructor" , ( done ) => {

		function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

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

		mutualTest( data , options , options , ( udata ) => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;

	it( "constructed instances, using a regular function as constructor, with arguments" , ( done ) => {

		function ZeClass( arg1 , arg2 ) {
			this.arg1 = arg1 ;
			this.arg2 = arg2 ;
			this.a = 4 ;
			this.b = 7 ;
		}

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

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

		mutualTest( data , options , options , ( udata ) => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;

	it( "constructed instances, with the 'unserializeContext' option" , async ( done ) => {

		function ZeClass( arg1 , arg2 ) {
			this.arg1 = arg1 ;
			this.arg2 = arg2 ;
			this.a = 4 ;
			this.b = 7 ;
		}

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

		var classMap = {
			ZeClass: {
				prototype: ZeClass.prototype ,
				serializer: function( obj ) {
					return [ obj.arg1 , obj.arg2 , { a: obj.a , b: obj.b } ] ;
				} ,
				unserializer: function( ctx , arg1 , arg2 ) {
					var object = new ZeClass( arg1 , arg2 ) ;
					if ( ctx ) { object.ctx = ctx ; }
					return object ;
				} ,
				unserializeContext: true
			}
		} ;

		var data = {
			v: new ZeClass( "arg1" , 2 ) ,
			v2: new ZeClass( { arg: 1 } , [ 2 ] )
		} ;

		data.v2.inc() ;

		try {
			await jsbindat.writeFile( __dirname + '/out.jsdat' , data , { classMap: classMap } ) ;
			var unserializedData = await jsbindat.readFile( __dirname + '/out.jsdat' , { classMap: classMap } ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			
			doormen.equals( unserializedData , {
				v: Object.assign( new ZeClass() , {
					a: 4 ,
					b: 7 ,
					arg1: "arg1" ,
					arg2: 2
				} ) ,
				v2: Object.assign( new ZeClass() , {
					a: 5 ,
					b: 8 ,
					arg1: { arg: 1 } ,
					arg2: [ 2 ]
				} )
			} ) ;
			
			await jsbindat.writeFile( __dirname + '/out.jsdat' , data , { classMap: classMap } ) ;
			var unserializedData = await jsbindat.readFile( __dirname + '/out.jsdat' , { classMap: classMap , context: "bob" } ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			
			doormen.equals( unserializedData , {
				v: Object.assign( new ZeClass() , {
					a: 4 ,
					b: 7 ,
					arg1: "arg1" ,
					arg2: 2 ,
					ctx: "bob"
				} ) ,
				v2: Object.assign( new ZeClass() , {
					a: 5 ,
					b: 8 ,
					arg1: { arg: 1 } ,
					arg2: [ 2 ] ,
					ctx: "bob"
				} )
			} ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;

	it( "constructed instances, test the Date object" , async( done ) => {

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
	
	it( "Serializer 'autoInstance' option" , async( done ) => {
		function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

		var serializerOptions = { autoInstance: true } ;

		var unserializerOptions = {
			classMap: new ClassMap( {
				ZeClass: ZeClass
			} )
		} ;

		var data = {
			v: new ZeClass()
		} ;

		//console.log( 'data: ' , data ) ;

		mutualTest( data , serializerOptions , unserializerOptions , udata => {
			//console.log( 'udata: ' , udata ) ;
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "Unserializer 'enableUnknown' option" , async( done ) => {
		function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

		var data = {
			v: new ZeClass()
		} ;

		//console.log( 'data: ' , data ) ;
		
		try {
			await jsbindat.writeFile( __dirname + '/out.jsdat' , data , { autoInstance: true } ) ;
			var unserializedData = await jsbindat.readFile( __dirname + '/out.jsdat' , { enableUnknown: true } ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			doormen.equals( unserializedData , {
				v: {
					__className__: "ZeClass" ,
					a: 4 ,
					b: 7
				}
			} ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
	
	it( "'autoInstance' with a .serializer() class method and 'enableUnknown'" , async( done ) => {
		function ZeClass( a = 4 , b = 7 ) {
			this.a = a ;
			this.b = b ;
		}

		ZeClass.serializer = function( object ) { return [ object.a , object.b , null ] ; } ;
		
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

		var data = {
			v: new ZeClass()
		} ;

		//console.log( 'data: ' , data ) ;
		
		try {
			await jsbindat.writeFile( __dirname + '/out.jsdat' , data , { autoInstance: true } ) ;
			var unserializedData = await jsbindat.readFile( __dirname + '/out.jsdat' , { enableUnknown: true } ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			doormen.equals( unserializedData , {
				v: {
					__constructorArgs__: [ 4 , 7 ] ,
					__className__: "ZeClass"
				}
			} ) ;
		}
		catch ( error ) {
			done( error ) ;
			return ;
		}
		
		done() ;
	} ) ;
	
	it( "Serializer 'prototypeChain' option and prototyped object (inheritance)" , async ( done ) => {
		
		var parent = {
			a: 1 ,
			b: 2
		} ;
		
		var child = Object.create( parent ) ;
		child.c = 3 ;
		
		var serializerOptions = { prototypeChain: true } ;
		var unserializerOptions = {} ;

		var data = {
			object: child
		} ;

		//console.log( 'data: ' , data ) ;

		mutualTest( data , serializerOptions , unserializerOptions , udata => {
			//console.log( 'udata: ' , udata ) ;
			//console.log( "udata.object's prototype: " , Object.getPrototypeOf( udata.object ) ) ;
			doormen.equals( Object.getPrototypeOf( udata.object ) , parent ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( udata.object ) ) , Object.prototype ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "Serializer 'prototypeChain' option and multiple object sharing the same prototype" , async ( done ) => {
		
		var parent = {
			a: 1 ,
			b: 2
		} ;
		
		var child = Object.create( parent ) ;
		child.c = 3 ;
		
		var child2 = Object.create( parent ) ;
		child2.d = 4 ;
		
		var child3 = Object.create( parent ) ;
		child3.e = 5 ;
		
		var serializerOptions = { prototypeChain: true } ;
		var unserializerOptions = {} ;

		var data = {
			object: child ,
			object2: child2 ,
			object3: child3
		} ;

		//console.log( 'data: ' , data ) ;

		mutualTest( data , serializerOptions , unserializerOptions , udata => {
			//console.log( 'udata: ' , udata ) ;
			//console.log( "udata.object's prototype: " , Object.getPrototypeOf( udata.object ) ) ;
			doormen.equals( Object.getPrototypeOf( udata.object ) , parent ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( udata.object ) ) , Object.prototype ) ;
			doormen.equals( Object.getPrototypeOf( udata.object2 ) , parent ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( udata.object2 ) ) , Object.prototype ) ;
			doormen.equals( Object.getPrototypeOf( udata.object3 ) , parent ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( udata.object3 ) ) , Object.prototype ) ;
			
			doormen.equals( Object.getPrototypeOf( udata.object ) === Object.getPrototypeOf( udata.object2 ) , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.object ) === Object.getPrototypeOf( udata.object3 ) , true ) ;
		} ).then( done , done ) ;
	} ) ;
	
	it( "Serializer 'prototypeChain' option and prototype chain" , async ( done ) => {
		
		var grandParent = {
			a: 1 ,
			b: 2
		} ;
		
		var parent1 = Object.create( grandParent ) ;
		parent1.c = 3 ;
		
		var parent2 = Object.create( grandParent ) ;
		parent2.d = 4 ;
		
		var child1 = Object.create( parent1 ) ;
		child1.e = 5 ;
		
		var child2 = Object.create( parent1 ) ;
		child2.f = 6 ;
		
		var child3 = Object.create( parent2 ) ;
		child3.g = 7 ;
		
		var serializerOptions = { prototypeChain: true } ;
		var unserializerOptions = {} ;

		var data = {
			object0: grandParent ,
			object1: child1 ,
			object2: child2 ,
			object3: child3 ,
			object4: parent1 ,
			object5: parent2 ,
		} ;

		//console.log( 'data: ' , data ) ;

		mutualTest( data , serializerOptions , unserializerOptions , udata => {
			//console.log( 'udata: ' , udata ) ;
			//console.log( "udata.object's prototype: " , Object.getPrototypeOf( udata.object ) ) ;
			doormen.equals( Object.getPrototypeOf( udata.object1 ) , parent1 ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( udata.object1 ) ) , grandParent ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( Object.getPrototypeOf( udata.object1 ) ) ) === Object.prototype , true ) ;
			
			doormen.equals( Object.getPrototypeOf( udata.object2 ) , parent1 ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( udata.object2 ) ) , grandParent ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( Object.getPrototypeOf( udata.object2 ) ) ) === Object.prototype , true ) ;
			
			doormen.equals( Object.getPrototypeOf( udata.object3 ) , parent2 ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( udata.object3 ) ) , grandParent ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( Object.getPrototypeOf( udata.object3 ) ) ) === Object.prototype , true ) ;
			
			doormen.equals( Object.getPrototypeOf( udata.object4 ) , grandParent ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( udata.object4 ) ) === Object.prototype , true ) ;
			
			doormen.equals( Object.getPrototypeOf( udata.object5 ) , grandParent ) ;
			doormen.equals( Object.getPrototypeOf( Object.getPrototypeOf( udata.object5 ) ) === Object.prototype , true ) ;
			
			doormen.equals( Object.getPrototypeOf( udata.object1 ) === udata.object4 , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.object2 ) === udata.object4 , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.object3 ) === udata.object5 , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.object4 ) === udata.object0 , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.object5 ) === udata.object0 , true ) ;
			//doormen.equals( Object.getPrototypeOf( udata.object ) === Object.getPrototypeOf( udata.object3 ) , true ) ;
		} ).then( done , done ) ;
	} ) ;
} ) ;



describe( "References and relational structures" , () => {

	it( "references (no duplicated object)" , ( done ) => {

		var data = {
			doc1: { a: 1 , b: 2 } ,
			doc2: { a: 4 , b: 7 } ,
			doc3: {} ,
			doc4: { mlinks: [] } ,
			doc5: {}
		} ;

		data.circular = data ;
		data.doc1.link = data.doc3 ;
		data.doc2.link = data.doc1 ;
		data.doc5.mlinks = [ data.doc1 , data.doc3 , data ] ;

		mutualTest( data , ( udata ) => {
			doormen.equals( udata.circular === udata , true ) ;
			doormen.equals( udata.doc2.link === udata.doc1 , true ) ;
			doormen.equals( udata.doc2.link === udata.doc1 , true ) ;
			doormen.equals( udata.doc5.mlinks[ 0 ] === udata.doc1 , true ) ;
			doormen.equals( udata.doc5.mlinks[ 1 ] === udata.doc3 , true ) ;
			doormen.equals( udata.doc5.mlinks[ 2 ] === udata , true ) ;
		} ).then( done , done ) ;
	} ) ;

	it( "instances without constructor self referencing itself and other instances" , ( done ) => {

		function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

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

		mutualTest( data , options , options , ( udata ) => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
			doormen.equals( udata.v.root === udata , true ) ;
			doormen.equals( udata.v.self === udata.v , true ) ;
			doormen.equals( udata.v.v2 === udata.v2 , true ) ;
			doormen.equals( udata.v2.v === udata.v , true ) ;
			doormen.equals( udata.v3 === udata.v2 , true ) ;
		} ).then( done , done ) ;
	} ) ;

	it( "instances with constructor self referencing itself and other instances" , ( done ) => {

		function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}

		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

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

		mutualTest( data , options , options , ( udata ) => {
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


