/*
	JS Binary Data

	Copyright (c) 2016 - 2025 Cédric Ronvel

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



const fs = require( 'fs' ) ;
const jsbindat = require( '..' ) ;
const ClassMap = jsbindat.ClassMap ;
const DataModel = jsbindat.DataModel ;
const string = require( 'string-kit' ) ;





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



async function serializeUnserializeParam( param , originalData , serializerOptions , unserializerOptions , context ) {
	if ( unserializerOptions === undefined && serializerOptions ) { unserializerOptions = serializerOptions ; }

	if ( param.binaryMode ) {
		await jsbindat.writeFile( __dirname + '/out.jsdat' , originalData , serializerOptions ) ;
		//console.log( 'before' ) ;
		var data = await jsbindat.readFile( __dirname + '/out.jsdat' , unserializerOptions , context ) ;
		//console.log( 'after' ) ;
		//deb( 'data' , data ) ;
	}
	else {
		let str = jsbindat.strSerialize( originalData , serializerOptions ) ;
		//console.log( 'before' ) ;
		var data = jsbindat.strUnserialize( str , unserializerOptions , context ) ;
		//console.log( 'after' ) ;
	}

	return data ;
} ;



async function mutualTestParam( param , originalData , serializerOptions , unserializerOptions , extraTestCb , useLike ) {
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
	else {
		if ( ! serializerOptions ) { serializerOptions = null ; }
		if ( ! unserializerOptions ) { unserializerOptions = null ; }
	}

	try {
		data = await serializeUnserializeParam( param , originalData , serializerOptions , unserializerOptions ) ;
		
		if ( useLike ) {
			expect( data ).to.be.like( originalData ) ;
		}
		else {
			expect( data ).to.equal( originalData ) ;
		}

		if ( originalData && typeof originalData === 'object' ) {
			//console.log( Object.getPrototypeOf( data ).constructor.name ) ;
			//console.log( data ) ;
			expect( Object.getPrototypeOf( data ) ).to.be( Object.getPrototypeOf( originalData ) ) ;
		}

	}
	catch ( error ) {
		//console.log( "Error!" , error ) ;
		//deb( "Input data" , originalData ) ;
		//deb( "Output data" , data ) ;
		throw error ;
		//return ;
	}

	if ( typeof extraTestCb === 'function' ) { extraTestCb( data ) ; }
}





/* Tests */



function reusableTests( serializeUnserialize , mutualTest ) {
	describe( "basic serialization/unserialization features" , () => {

		it( "undefined" , async () => {
			await mutualTest( undefined ) ;
		} ) ;

		it( "null" , async () => {
			await mutualTest( null ) ;
		} ) ;

		it( "false" , async () => {
			await mutualTest( false ) ;
		} ) ;

		it( "true" , async () => {
			await mutualTest( true ) ;
		} ) ;

		it( "numbers" , async () => {
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
		} ) ;

		it( "strings" , async () => {
			await mutualTest( '' ) ;
			await mutualTest( 'a' ) ;
			await mutualTest( 'a string' ) ;
			await mutualTest( 'a'.repeat( 32 ) ) ;
			await mutualTest( 'a'.repeat( 64 ) ) ;
			await mutualTest( 'a'.repeat( 128 ) ) ;
			await mutualTest( 'a'.repeat( 256 ) ) ;
			await mutualTest( 'a'.repeat( 512 ) ) ;
			await mutualTest( 'this is a really really really big big big string!'.repeat( 10 ) ) ;
			await mutualTest( 'this is a really really really big big big string!'.repeat( 100 ) ) ;
			await mutualTest( 'this is a really really really big big big string!'.repeat( 2000 ) ) ;
			await mutualTest( 'this is a really really really big big big string!'.repeat( 200000 ) ) ;
		} ) ;

		it( "arrays" , async () => {
			await mutualTest( [] ) ;
			await mutualTest( [ true , false ] ) ;
			await mutualTest( [ 1 , 2 , 3 , true , false , null , 'a string' , 'another string' ] ) ;
		} ) ;

		it( "ES6 Set" , async () => {
			var set_ ;

			await mutualTest( new Set() ) ;
			set_ = new Set() ;
			set_.add( 1 ) ;
			set_.add( "bob" ) ;
			await mutualTest( set_ ) ;

			set_ = new Set() ;
			set_.add( { a: 1 } ) ;
			set_.add( { b: 2 } ) ;
			await mutualTest( set_ ) ;
		} ) ;

		it( "nested arrays" , async () => {
			await mutualTest( [
				[ 1 , 2 , 3 ] ,
				[ true , false ] ,
				[ null , 'another string' , 'this is a really really really big big big string!'.repeat( 100 ) , 'a string' ]
			] ) ;
		} ) ;

		it( "objects" , async () => {
			var big = 'this is a really really really big big big string!'.repeat( 100 ) ;

			var bigKeyObject = {
				a: 1 , b: 2 , c: true , d: 'a string' , f: big , abcdefghijklmnopq: true , g: 'gee'
			} ;
			bigKeyObject[ big ] = big ;
			bigKeyObject.notbig = 'notbigstring' ;

			await mutualTest( {} ) ;
			await mutualTest( { a: 1 , b: 2 } ) ;
			await mutualTest( {
				a: 1 , b: 2 , c: true , d: 'a string' , f: 'big' , abcdefghijklmnopq: true , g: 'gee'
			} ) ;
			await mutualTest( bigKeyObject ) ;
		} ) ;

		it( "nested objects" , async () => {
			await mutualTest( {
				sub: { a: 1 , sub: {} } ,
				sub2: { b: 2 , sub: { sub: { sub: { c: 3 } } } } ,
				d: 4
			} ) ;
		} ) ;

		it( "nested arrays and objects" , async () => {
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
		} ) ;

		it( "ES6 Map" , async () => {
			var map ;

			await mutualTest( new Map() ) ;

			map = new Map() ;
			map.set( { jack: '2' } , 1 ) ;
			map.set( "bob" , "bill" ) ;
			map.set( { keyKey: 'value of key' } , { valueKey: 'value of value' } ) ;
			await mutualTest( map ) ;
		} ) ;

		it( "Date" , async () => {
			// Let allocUnsafe() create some garbage data...
			var date = new Date( '2019-06-12T18:02:15Z' ) ;
			await mutualTest( date ) ;
			await mutualTest( { date } ) ;
			await mutualTest( [ date , date , date ] ) ;
		} ) ;

		it( "Buffer" , async () => {
			// Let allocUnsafe() create some garbage data...
			await mutualTest( Buffer.allocUnsafe( 10 ) ) ;
			await mutualTest( Buffer.allocUnsafe( 100 ) ) ;
			await mutualTest( Buffer.allocUnsafe( 1000000 ) ) ;
		} ) ;

		it( "Object.prototype" , async () => {
			await mutualTest( Object.prototype , null , null , udata => {
				expect( udata ).to.be( Object.prototype ) ;
			} ) ;
		} ) ;

		it( "Functions should be serialized/unserialized only if 'enableFunction' is set (default to false)" , async () => {
			var data = {
				a: 1 ,
				fn: function( a , b ) { return a + b ; } ,
				arrowFn: ( a , b ) => a - b ,
				b: 2
			} ;

			var unserializedData = await serializeUnserialize( data ) ;
			
			expect( unserializedData.a ).to.be( 1 ) ;
			expect( unserializedData.b ).to.be( 2 ) ;
			expect( unserializedData.fn ).to.be.undefined() ;
			expect( unserializedData.arrowFn ).to.be.undefined() ;

			var unserializedData = await serializeUnserialize( data , { enableFunction: true } ) ;
			
			expect( unserializedData.a ).to.be( 1 ) ;
			expect( unserializedData.b ).to.be( 2 ) ;
			expect( unserializedData.fn( 7 , 4 ) ).to.be( 11 ) ;
			expect( unserializedData.arrowFn( 7 , 4 ) ).to.be( 3 ) ;
		} ) ;
		
		it( "real-world test" , async () => {
			await mutualTest( require( '../sample/sample1.json' ) ) ;
		} ) ;
	} ) ;



	describe( "Instances" , () => {

		it( "empty instances without constructor" , async () => {
			function ZeClass() {}

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var params = {
				classMap: new ClassMap( {
					ZeClass: ZeClass
				} )
			} ;

			var data = {
				v: new ZeClass()
			} ;

			//console.log( 'data: ' , data ) ;

			await mutualTest( data , params , params , udata => {
				//console.log( 'udata: ' , udata ) ;
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
			} ) ;
		} ) ;

		it( "instances without constructor" , async () => {
			function ZeClass() {
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var params = {
				classMap: {
					ZeClass: ZeClass
				}
			} ;

			var data = {
				v: new ZeClass()
			} ;

			//console.log( 'data: ' , data ) ;

			await mutualTest( data , params , params , udata => {
				//console.log( 'udata: ' , udata ) ;
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
			} ) ;
		} ) ;

		it( "constructed instances, using a 'new' type of constructor" , async () => {
			function ZeClass() {
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.serializer = function( obj ) {
				return { override: obj } ;
			} ;

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var params = {
				classMap: {
					ZeClass: ZeClass
				}
			} ;

			var data = {
				v: new ZeClass() ,
				v2: new ZeClass()
			} ;

			data.v2.inc() ;

			await mutualTest( data , params , params , udata => {
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
				expect( Object.getPrototypeOf( udata.v2 ) ).to.be( ZeClass.prototype ) ;
			} ) ;
		} ) ;

		it( "constructed instances, using a 'new' type of constructor with arguments" , async () => {
			function ZeClass( arg1 , arg2 ) {
				this.arg1 = arg1 ;
				this.arg2 = arg2 ;
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.serializer = function( obj ) {
				return { args: [ obj.arg1 , obj.arg2 ] , override: { a: obj.a , b: obj.b } } ;
			} ;

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var params = {
				classMap: {
					ZeClass: ZeClass
				}
			} ;

			var data = {
				v: new ZeClass( "arg1" , 2 ) ,
				v2: new ZeClass( { arg: 1 } , [ 2 ] )
			} ;

			data.v2.inc() ;

			await mutualTest( data , params , params , ( udata ) => {
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
			} ) ;
		} ) ;

		it( "constructed instances, using a regular function as constructor" , async () => {
			function ZeClass() {
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var params = {
				classMap: {
					ZeClass: {
						prototype: ZeClass.prototype ,
						serializer: function( obj ) { return { override: obj } ; } ,
						unserializer: function() { return new ZeClass() ; }
					}
				}
			} ;

			var data = {
				v: new ZeClass() ,
				v2: new ZeClass()
			} ;

			data.v2.inc() ;

			await mutualTest( data , params , params , ( udata ) => {
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
			} ) ;
		} ) ;

		it( "constructed instances, using 'overrideKeys' and 'override'" , async () => {
			function ZeClass() {
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var params = {
				classMap: {
					ZeClass: {
						prototype: ZeClass.prototype ,
						serializer: function( obj ) { return { override: obj , overrideKeys: [ 'a' , 'c' ] } ; } ,
						unserializer: function() { return new ZeClass() ; }
					}
				}
			} ;

			var data = new ZeClass() ;
			data.a = 12 ;
			data.b = 18 ;

			var unserializedData = await serializeUnserialize( data , params ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			
			expect( unserializedData ).to.equal( Object.assign( new ZeClass() , {
				a: 12 ,
				b: 7
			} ) ) ;
		} ) ;

		it( "constructed instances, using 'overrideKeys' without 'override'" , async () => {
			function ZeClass() {
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var params = {
				classMap: {
					ZeClass: {
						prototype: ZeClass.prototype ,
						serializer: function( obj ) { return { overrideKeys: [ 'a' , 'c' ] } ; } ,
						unserializer: function() { return new ZeClass() ; }
					}
				}
			} ;

			var data = new ZeClass() ;
			data.a = 12 ;
			data.b = 18 ;

			var unserializedData = await serializeUnserialize( data , params ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			
			expect( unserializedData ).to.equal( Object.assign( new ZeClass() , {
				a: 12 ,
				b: 7
			} ) ) ;
		} ) ;
		
		it( "constructed instances, using a regular function as constructor, with arguments" , async () => {
			function ZeClass( arg1 , arg2 ) {
				this.arg1 = arg1 ;
				this.arg2 = arg2 ;
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var params = {
				classMap: {
					ZeClass: {
						prototype: ZeClass.prototype ,
						serializer: function( obj ) {
							return { args: [ obj.arg1 , obj.arg2 ] , override: { a: obj.a , b: obj.b } } ;
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

			await mutualTest( data , params , params , ( udata ) => {
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
			} ) ;
		} ) ;

		it( "constructed instances, with the 'unserializeContext' option" , async () => {
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
						return { args: [ obj.arg1 , obj.arg2 ] , override: { a: obj.a , b: obj.b } } ;
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

			var unserializedData = await serializeUnserialize( data , { classMap } ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			
			expect( unserializedData ).to.equal( {
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
			
			var unserializedData = await serializeUnserialize( data , { classMap } , { classMap } , "bob" ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			
			expect( unserializedData ).to.equal( {
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
		} ) ;

		it( "constructed instances, with the 'universal' serializer/unserializer option" , async () => {
			function ZeClass( arg1 , arg2 ) {
				this.arg1 = arg1 ;
				this.arg2 = arg2 ;
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var universal = {
				serializer: function( obj ) {
					var proto = Object.getPrototypeOf( obj ) ;
					var className = proto === ZeClass.prototype ? 'ZeClass' : '' ;
					
					return {
						className: className ,
						args: [ obj.arg1 , obj.arg2 ] ,
						override: { a: obj.a , b: obj.b }
					} ;
				} ,
				unserializer: function( ctx , className , arg1 , arg2 ) {
					var object ;
					
					if ( className === 'ZeClass' ) {
						object = new ZeClass( arg1 , arg2 ) ;
					}
					else {
						object = {} ;
					}
					
					if ( ctx ) { object.ctx = ctx ; }
					return object ;
				} ,
				unserializeClassName: true ,
				unserializeContext: true
			} ;

			var data = {
				v: new ZeClass( "arg1" , 2 ) ,
				v2: new ZeClass( { arg: 1 } , [ 2 ] )
			} ;

			data.v2.inc() ;

			var unserializedData = await serializeUnserialize( data , { universal } ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			
			expect( unserializedData ).to.equal( {
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
			
			var unserializedData = await serializeUnserialize( data , { universal } , { universal } , "bob" ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			
			expect( unserializedData ).to.equal( {
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
		} ) ;

		it( "constructed instances, test a fake Date object" , async () => {
			function FakeDate( ... args ) {
				this.date = new Date( ... args ) ;
			}
			
			var params = {
				classMap: {
					FakeDate: {
						prototype: FakeDate.prototype ,
						unserializer: function( arg ) {
							return new FakeDate( arg ) ;
						} ,
						serializer: function( value ) {
							return { args: [ value.date.getTime() ] } ;
						}
					}
				}
			} ;

			await mutualTest( new FakeDate() , params , params ) ;
			await mutualTest( [ new FakeDate() , new FakeDate() , new FakeDate() ] , params , params ) ;
			await mutualTest( { a: new FakeDate() , b: new FakeDate() , c: new FakeDate() } , params , params ) ;
		} ) ;
		
		it( "Serializer 'autoInstance' option" , async () => {
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

			await mutualTest( data , serializerOptions , unserializerOptions , udata => {
				//console.log( 'udata: ' , udata ) ;
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
			} ) ;
		} ) ;
		
		it( "Unserializer 'enableUnknown' option" , async () => {
			function ZeClass() {
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var data = {
				v: new ZeClass()
			} ;

			//console.log( 'data: ' , data ) ;
			var unserializedData = await serializeUnserialize( data , { autoInstance: true } , { enableUnknown: true } ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			
			expect( unserializedData ).to.be.like( {
				v: {
					__className__: "ZeClass" ,
					a: 4 ,
					b: 7
				}
			} ) ;
		} ) ;
		
		it( "'autoInstance' with a .serializer() class method and 'enableUnknown'" , async () => {
			function ZeClass( a = 4 , b = 7 ) {
				this.a = a ;
				this.b = b ;
			}

			ZeClass.serializer = function( object ) { return { args: [ object.a , object.b ] } ; } ;
			
			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var data = {
				v: new ZeClass()
			} ;

			//console.log( 'data: ' , data ) ;
			var unserializedData = await serializeUnserialize( data , { autoInstance: true } , { enableUnknown: true } ) ;
			//deb( "unserializedData:" , unserializedData ) ;
			
			expect( unserializedData ).to.be.like( {
				v: {
					__constructorArgs__: [ 4 , 7 ] ,
					__className__: "ZeClass"
				}
			} ) ;
		} ) ;
		
		it( "Serializer 'prototypeChain' option and prototyped object (inheritance)" , async () => {
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

			await mutualTest( data , serializerOptions , unserializerOptions , udata => {
				//console.log( 'udata: ' , udata ) ;
				//console.log( "udata.object's prototype: " , Object.getPrototypeOf( udata.object ) ) ;
				expect( Object.getPrototypeOf( udata.object ) ).to.equal( parent ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( udata.object ) ) ).to.be( Object.prototype ) ;
			} , true ) ;
		} ) ;
		
		it( "Serializer 'prototypeChain' option and multiple object sharing the same prototype" , async () => {
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

			await mutualTest( data , serializerOptions , unserializerOptions , udata => {
				//console.log( 'udata: ' , udata ) ;
				//console.log( "udata.object's prototype: " , Object.getPrototypeOf( udata.object ) ) ;
				expect( Object.getPrototypeOf( udata.object ) ).to.equal( parent ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( udata.object ) ) ).to.be( Object.prototype ) ;
				expect( Object.getPrototypeOf( udata.object2 ) ).to.equal( parent ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( udata.object2 ) ) ).to.be( Object.prototype ) ;
				expect( Object.getPrototypeOf( udata.object3 ) ).to.equal( parent ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( udata.object3 ) ) ).to.be( Object.prototype ) ;
				
				expect( Object.getPrototypeOf( udata.object ) ).to.be( Object.getPrototypeOf( udata.object2 ) ) ;
				expect( Object.getPrototypeOf( udata.object ) ).to.be( Object.getPrototypeOf( udata.object3 ) ) ;
			} , true ) ;
		} ) ;
		
		it( "Serializer 'prototypeChain' option and prototype chain" , async () => {
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

			await mutualTest( data , serializerOptions , unserializerOptions , udata => {
				//console.log( 'udata: ' , udata ) ;
				//console.log( "udata.object's prototype: " , Object.getPrototypeOf( udata.object ) ) ;
				expect( Object.getPrototypeOf( udata.object1 ) ).to.be.like( parent1 ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( udata.object1 ) ) ).to.be.like( grandParent ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( Object.getPrototypeOf( udata.object1 ) ) ) ).to.be( Object.prototype ) ;
				
				expect( Object.getPrototypeOf( udata.object2 ) ).to.be.like( parent1 ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( udata.object2 ) ) ).to.be.like( grandParent ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( Object.getPrototypeOf( udata.object2 ) ) ) ).to.be( Object.prototype ) ;
				
				expect( Object.getPrototypeOf( udata.object3 ) ).to.be.like( parent2 ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( udata.object3 ) ) ).to.be.like( grandParent ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( Object.getPrototypeOf( udata.object3 ) ) ) ).to.be( Object.prototype ) ;
				
				expect( Object.getPrototypeOf( udata.object4 ) ).to.be.like( grandParent ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( udata.object4 ) ) ).to.be( Object.prototype ) ;
				
				expect( Object.getPrototypeOf( udata.object5 ) ).to.be.like( grandParent ) ;
				expect( Object.getPrototypeOf( Object.getPrototypeOf( udata.object5 ) ) ).to.be( Object.prototype ) ;
				
				expect( Object.getPrototypeOf( udata.object1 ) ).to.be( udata.object4 ) ;
				expect( Object.getPrototypeOf( udata.object2 ) ).to.be( udata.object4 ) ;
				expect( Object.getPrototypeOf( udata.object3 ) ).to.be( udata.object5 ) ;
				expect( Object.getPrototypeOf( udata.object4 ) ).to.be( udata.object0 ) ;
				expect( Object.getPrototypeOf( udata.object5 ) ).to.be( udata.object0 ) ;
			} , true ) ;
		} ) ;
		
		it( "'unserializeFinalizer' option" ) ;
	} ) ;



	describe( "References and relational structures" , () => {

		it( "references (no duplicated object)" , async () => {
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

			await mutualTest( data , ( udata ) => {
				expect( udata.circular ).to.be( udata ) ;
				expect( udata.doc2.link ).to.be( udata.doc1 ) ;
				expect( udata.doc2.link ).to.be( udata.doc1 ) ;
				expect( udata.doc5.mlinks[ 0 ] ).to.be( udata.doc1 ) ;
				expect( udata.doc5.mlinks[ 1 ] ).to.be( udata.doc3 ) ;
				expect( udata.doc5.mlinks[ 2 ] ).to.be( udata ) ;
			} ) ;
		} ) ;

		it( "instances without constructor self referencing itself and other instances" , async () => {
			function ZeClass() {
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var params = {
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

			await mutualTest( data , params , params , ( udata ) => {
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
				expect( Object.getPrototypeOf( udata.v2 ) ).to.be( ZeClass.prototype ) ;
				expect( udata.v.root ).to.be( udata ) ;
				expect( udata.v.self ).to.be( udata.v ) ;
				expect( udata.v.v2 ).to.be( udata.v2 ) ;
				expect( udata.v2.v ).to.be( udata.v ) ;
				expect( udata.v3 ).to.be( udata.v2 ) ;
			} ) ;
		} ) ;

		it( "instances with constructor self referencing itself and other instances" , async () => {
			function ZeClass() {
				this.a = 4 ;
				this.b = 7 ;
			}

			ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;

			var params = {
				classMap: {
					ZeClass: {
						prototype: ZeClass.prototype ,
						serializer: function( obj ) {

							// Back up anything except constructor args
							var clone = Object.assign( {} , obj ) ;
							delete clone.arg1 ;
							delete clone.arg2 ;

							return { args: [ obj.arg1 , obj.arg2 ] , override: clone } ;
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

			await mutualTest( data , params , params , ( udata ) => {
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
				expect( Object.getPrototypeOf( udata.v2 ) ).to.be( ZeClass.prototype ) ;
				expect( udata.v.root ).to.be( udata ) ;
				expect( udata.v.self ).to.be( udata.v ) ;
				expect( udata.v.v2 ).to.be( udata.v2 ) ;
				expect( udata.v2.v ).to.be( udata.v ) ;
				expect( udata.v3 ).to.be( udata.v2 ) ;
			} ) ;
		} ) ;
	} ) ;
}



describe( "String serializer/unserializer" , () => {
	reusableTests(
		( ... args ) => serializeUnserializeParam( { binaryMode: false } , ... args ) ,
		( ... args ) => mutualTestParam( { binaryMode: false } , ... args )
	) ;
} ) ;



describe( "Binary serializer/unserializer" , () => {
	var serializeUnserialize = ( ... args ) => serializeUnserializeParam( { binaryMode: true } , ... args ) ;
	var mutualTest = ( ... args ) => mutualTestParam( { binaryMode: true } , ... args ) ;

	reusableTests( serializeUnserialize , mutualTest ) ;

	// Tests that are only supported by Binary serializer/unserializer

	describe( "Data model - improve space-efficiency when serializing known and typed data" , () => {

		it( "TypedArray model" , async () => {
			var data , model , params ;

			model = new DataModel.TypedArray( 'uint32' ) ;
			params = { model } ;

			data = [] ;
			await mutualTest( data , params , params ) ;

			data = [ 14 , 1 , 487 , 742 ] ;
			await mutualTest( data , params , params ) ;

			model = new DataModel.TypedArray( 'uint8' ) ;
			params = { model } ;
			data = [ 21 , 0 , 4 , 7 , 78 ] ;
			await mutualTest( data , params , params ) ;

			model = new DataModel.TypedArray( 'lps8string' ) ;
			params = { model } ;
			data = [ "Hello my friend" , "stay awhile and listen" ] ;
			await mutualTest( data , params , params ) ;
		} ) ;

		it( "FixedTypedArray model" , async () => {
			var data , model , params ;

			model = new DataModel.FixedTypedArray( 'uint8' , 5 ) ;
			params = { model } ;

			data = [ 21 , 0 , 4 , 7 , 78 ] ;
			await mutualTest( data , params , params ) ;

			data = [] ;
			var output = await serializeUnserialize( data , params , params ) ;
			expect( output ).to.equal( [ 0 , 0 , 0 , 0 , 0 ] ) ;

			data = [ 21 , 0 , 4 , 7 , 78 , 33 , 75 ] ;
			output = await serializeUnserialize( data , params , params ) ;
			expect( output ).to.equal( [ 21 , 0 , 4 , 7 , 78 ] ) ;

			model = new DataModel.FixedTypedArray( 'lps8string' , 2 ) ;
			params = { model } ;
			data = [ "Hello my friend" , "stay awhile and listen" ] ;
			await mutualTest( data , params , params ) ;
		} ) ;

		it( "SealedObject model" , async () => {
			var data , model , params ;

			model = new DataModel.SealedObject( [
				[ 'x' , 'number' ] ,
				[ 'y' , 'number' ] ,
				[ 'z' , 'number' ] ,
				[ 'vx' , 'number' ] ,
				[ 'vy' , 'number' ] ,
				[ 'vz' , 'number' ]
			] ) ;
			params = { model } ;

			data = { x: 3.12 , y: 7.47 , z: -4.21 , vx: 0.125 , vy: -0.125 , vz: 0 } ;
			await mutualTest( data , params , params ) ;

			model = new DataModel.SealedObject( [
				[ 'x' , 'float32' ] ,
				[ 'y' , 'float32' ] ,
				[ 'z' , 'float32' ] ,
				[ 'vx' , 'float32' ] ,
				[ 'vy' , 'float32' ] ,
				[ 'vz' , 'float32' ]
			] ) ;
			params = { model } ;

			data = { x: 3 , y: 7 , z: -4 , vx: 0.125 , vy: -0.125 , vz: 0 } ;
			await mutualTest( data , params , params ) ;

			model = new DataModel.SealedObject( [
				[ 'firstName' , 'lps8string' ] ,
				[ 'lastName' , 'lps8string' ] ,
				[ 'age' , 'uint8' ] ,
				// IMPORTANT: Pack booleans, they will use only 1 bit instead of 1 byte
				[ 'alive' , 'boolean' ] ,
				[ 'bleeding' , 'boolean' ] ,
				[ 'poisoned' , 'boolean' ]
			] ) ;
			params = { model } ;

			data = { firstName: "Bobby" , lastName: "Wallace" , age: 54 , alive: true , bleeding: false , poisoned: false } ;
			await mutualTest( data , params , params ) ;
		} ) ;

		it( "Nested DataModels inside a SealedObject model" , async () => {
			var data , params ;

			var vector3dModel = new DataModel.SealedObject( [
				[ 'x' , 'float32' ] ,
				[ 'y' , 'float32' ] ,
				[ 'z' , 'float32' ]
			] ) ;

			var inventoryModel = new DataModel.TypedArray( 'lps8string' ) ;

			var entityModel = new DataModel.SealedObject( [
				[ 'name' , 'lps8string' ] ,
				[ 'position' , vector3dModel ] ,
				[ 'speed' , vector3dModel ] ,
				[ 'inventory' , inventoryModel ]
			] ) ;

			params = { model: entityModel } ;

			data = { name: "Bobby" , position: { x: 3 , y: 7 , z: -4 } , speed: { x: 0.125 , y: -0.125 , z: 0 } , inventory: [ 'sword' , 'boots' ] } ;
			await mutualTest( data , params , params ) ;
			//var out = await serializeUnserialize( data , params , params ) ; console.log( "out:" , out ) ;
		} ) ;

		it( "Nested DataModels inside a TypedArray model" , async () => {
			var data , params ;

			var itemModel = new DataModel.SealedObject( [
				[ 'id' , 'lps8string' ] ,
				[ 'quantity' , 'uint8' ]
			] ) ;

			var inventoryModel = new DataModel.TypedArray( itemModel ) ;

			params = { model: inventoryModel } ;

			data = [ { id: 'apple' , quantity: 3 } , { id: 'healingPotion' , quantity: 2 } ] ;
			await mutualTest( data , params , params ) ;
			//var out = await serializeUnserialize( data , params , params ) ; console.log( "out:" , out ) ;

			var vector3dModel = new DataModel.FixedTypedArray( 'float32' , 3 ) ;
			var dotsModel = new DataModel.TypedArray( vector3dModel ) ;

			params = { model: dotsModel } ;
			data = [ [ 1 , 2 , 5 ] , [ -4 , 7 , -1 ] ] ;
			await mutualTest( data , params , params ) ;
		} ) ;

		it( "Support for 'any' (dynamic) data inside a model" , async () => {
			var data , model , params ;

			await mutualTest( data , params , params ) ;

			model = new DataModel.SealedObject( [
				[ 'name' , 'lps8string' ] ,
				[ 'data' , 'any' ] ,
			] ) ;
			params = { model } ;

			data = { name: "Bobby" , data: null } ;
			await mutualTest( data , params , params ) ;

			data = { name: "Bobby" , data: true } ;
			await mutualTest( data , params , params ) ;

			data = { name: "Bobby" , data: { some: "data" , more: "data..." } } ;
			await mutualTest( data , params , params ) ;
		} ) ;

		it( "Support constructorless instances serialization using a model" , async () => {
			function ZeClass() {
				this.firstProperty = 4 ;
				this.secondProperty = 7 ;
			}

			ZeClass.prototype.inc = function() { this.firstProperty ++ ; this.secondProperty ++ ; } ;

			var ZeClassModel = new DataModel.SealedObject( [
				[ 'firstProperty' , 'uint16' ] ,
				[ 'secondProperty' , 'uint16' ] ,
			] ) ;

			var params = {
				classMap: {
					ZeClass: {
						prototype: ZeClass.prototype ,
						model: ZeClassModel
					}
				}
			} ;

			var data = {
				v: new ZeClass() ,
				v2: new ZeClass()
			} ;

			data.v2.inc() ;

			await mutualTest( data , params , params , ( udata ) => {
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
			} ) ;

			var fileData = await fs.promises.readFile( __dirname + '/out.jsdat' ) ;
			//console.log( "File size:" , fileData.length ) ;
			expect( fileData.length ).to.be( 37 ) ;	// instead of 101 without data model
		} ) ;

		it( "Support instances with constructor serialization using a model" , async () => {
			function ZeClass() {
				this.firstProperty = 4 ;
				this.secondProperty = 7 ;
			}

			ZeClass.prototype.inc = function() { this.firstProperty ++ ; this.secondProperty ++ ; } ;

			var ZeClassModel = new DataModel.SealedObject( [
				[ 'firstProperty' , 'uint16' ] ,
				[ 'secondProperty' , 'uint16' ] ,
			] ) ;

			var params = {
				classMap: {
					ZeClass: {
						prototype: ZeClass.prototype ,
						serializer: function( obj ) { return { override: obj } ; } ,
						unserializer: function() { return new ZeClass() ; } ,
						argumentsModel: null ,
						overrideModel: ZeClassModel
					}
				}
			} ;

			var data = {
				v: new ZeClass() ,
				v2: new ZeClass()
			} ;

			data.v2.inc() ;

			await mutualTest( data , params , params , ( udata ) => {
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
			} ) ;

			var fileData = await fs.promises.readFile( __dirname + '/out.jsdat' ) ;
			//console.log( "File size:" , fileData.length ) ;
			expect( fileData.length ).to.be( 39 ) ;	// instead of 103 without data model
		} ) ;

		it( "Support instances with constructor with arguments serialization using a model" , async () => {
			function ZeClass( arg1 , arg2 ) {
				this.arg1 = arg1 ;
				this.arg2 = arg2 ;
				this.firstProperty = 4 ;
				this.secondProperty = 7 ;
			}

			ZeClass.prototype.inc = function() { this.firstProperty ++ ; this.secondProperty ++ ; } ;

			var ZeClassArgumentsModel = new DataModel.FixedTypedArray( 'uint16' , 2 ) ;

			var ZeClassOverrideModel = new DataModel.SealedObject( [
				[ 'firstProperty' , 'uint16' ] ,
				[ 'secondProperty' , 'uint16' ] ,
			] ) ;

			var params = {
				classMap: {
					ZeClass: {
						prototype: ZeClass.prototype ,
						serializer: function( obj ) {
							return { args: [ obj.arg1 , obj.arg2 ] , override: { firstProperty: obj.firstProperty , secondProperty: obj.secondProperty } } ;
						} ,
						unserializer: function( arg1 , arg2 ) { return new ZeClass( arg1 , arg2 ) ; } ,
						argumentsModel: ZeClassArgumentsModel ,
						overrideModel: ZeClassOverrideModel
					}
				}
			} ;

			var data = {
				v: new ZeClass( 15 , 13 ) ,
				v2: new ZeClass( 10 , 11 )
			} ;

			data.v2.inc() ;

			await mutualTest( data , params , params , ( udata ) => {
				expect( Object.getPrototypeOf( udata.v ) ).to.be( ZeClass.prototype ) ;
			} ) ;

			var fileData = await fs.promises.readFile( __dirname + '/out.jsdat' ) ;
			//console.log( "File size:" , fileData.length ) ;
			expect( fileData.length ).to.be( 45 ) ;	// instead of 113 without data model
		} ) ;
	} ) ;
} ) ;



/*
it( "debug" , () => {
	console.log( jsbindat.strSerialize( undefined ) ) ;
	console.log( jsbindat.strSerialize( null ) ) ;
	console.log( jsbindat.strSerialize( true ) ) ;
	console.log( jsbindat.strSerialize( 10 ) ) ;
	console.log( jsbindat.strSerialize( 1.25487 ) ) ;
	console.log( jsbindat.strSerialize( "Hello Bob!" ) ) ;
	console.log( jsbindat.strSerialize( [ 1.25487 , "Bob!" , false , null , NaN ] ) ) ;
	console.log( jsbindat.strSerialize( { number: 1.25487 , name: "Bob!" , p1: false , p2: null , p3: NaN } ) ) ;
	console.log( JSON.stringify( { number: 1.25487 , name: "Bob!" , p1: false , p2: null , p3: NaN } ) ) ;
	console.log( jsbindat.strSerialize( new Date() ) ) ;
	console.log( JSON.stringify( new Date() ) ) ;
	console.log( jsbindat.strSerialize( { number: 1.25487 , name: "Bob!" , array:[ {},[],[1,2,3],{a:1,b:2},{c:1,d:{e:3},f:4} ] } ) ) ;
	console.log( jsbindat.strSerialize( { buf: Buffer.from( 'Hello Bob!' ) } ) ) ;

	console.log( jsbindat.strUnserialize( jsbindat.strSerialize( 1.25487 ) ) ) ;
	console.log( jsbindat.strUnserialize( jsbindat.strSerialize( "Hello Bob!" ) ) ) ;
	console.log( jsbindat.strUnserialize( jsbindat.strSerialize( [ 1.25487 , "Bob!" , false , null , NaN ] ) ) ) ;
	console.log( jsbindat.strUnserialize( jsbindat.strSerialize( new Date() ) ) ) ;
	console.log( jsbindat.strUnserialize( jsbindat.strSerialize( { number: 1.25487 , name: "Bob!" , p1: false , p2: null , p3: NaN } ) ) ) ;
	console.log( jsbindat.strUnserialize( jsbindat.strSerialize( { number: 1.25487 , name: "Bob!" , array:[ {},[],[1,2,3],{a:1,b:2},{c:1,d:{e:3},f:4} ] } ) ) ) ;
	console.log( jsbindat.strUnserialize( jsbindat.strSerialize( { buf: Buffer.from( 'Hello Bob!' ) } ) ) ) ;
} ) ;
//*/

