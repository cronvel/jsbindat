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



const fs = require( 'fs' ) ;
const jsbindat = require( '..' ) ;
const ClassMap = jsbindat.ClassMap ;
//const expect = require( 'expect.js' ) ;
const Promise = require( 'seventh' ) ;
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



describe( "str-mode" , () => {

	it( "misc" , () => {
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
		console.log( jsbindat.strSerialize( new Date() , { classMap: jsbindat.builtIn } ) ) ;
		console.log( JSON.stringify( new Date() ) ) ;
		console.log( jsbindat.strSerialize( { number: 1.25487 , name: "Bob!" , array:[ {},[],[1,2,3],{a:1,b:2},{c:1,d:{e:3},f:4} ] } ) ) ;
		console.log( jsbindat.strSerialize( { buf: Buffer.from( 'Hello Bob!' ) } ) ) ;

		console.log( jsbindat.strUnserialize( jsbindat.strSerialize( 1.25487 ) ) ) ;
		console.log( jsbindat.strUnserialize( jsbindat.strSerialize( "Hello Bob!" ) ) ) ;
		console.log( jsbindat.strUnserialize( jsbindat.strSerialize( [ 1.25487 , "Bob!" , false , null , NaN ] ) ) ) ;
		console.log( jsbindat.strUnserialize( jsbindat.strSerialize( new Date() , { classMap: jsbindat.builtIn } ) , { classMap: jsbindat.builtIn } ) ) ;
		console.log( jsbindat.strUnserialize( jsbindat.strSerialize( { number: 1.25487 , name: "Bob!" , p1: false , p2: null , p3: NaN } ) ) ) ;
		console.log( jsbindat.strUnserialize( jsbindat.strSerialize( { number: 1.25487 , name: "Bob!" , array:[ {},[],[1,2,3],{a:1,b:2},{c:1,d:{e:3},f:4} ] } ) ) ) ;
		console.log( jsbindat.strUnserialize( jsbindat.strSerialize( { buf: Buffer.from( 'Hello Bob!' ) } ) ) ) ;
	} ) ;
	
	it( "Code strUnserialize() functions marked with TODO???" ) ;
	it( "Find a way to re-use binary tests" ) ;
} ) ;

