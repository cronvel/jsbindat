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



const jsbindat = {} ;
module.exports = jsbindat ;



jsbindat.ClassMap = require( './ClassMap.js' ) ;
jsbindat.Unknown = require( './Unknown.js' ) ;
jsbindat.serialize = require( './serialize.js' ) ;
jsbindat.unserialize = require( './unserialize.js' ) ;

jsbindat.strSerialize = require( './strSerialize.js' ) ;
jsbindat.strUnserialize = require( './strUnserialize.js' ) ;



jsbindat.writeFile = async function writeFile( filePath , data , options ) {
	var stream = fs.createWriteStream( filePath ) ;

	await jsbindat.serialize( stream , data , options ) ;
	await stream.endAsync() ;	// created by StreamBuffer
} ;



jsbindat.readFile = async function readFile( filePath , options , context ) {
	var stream = fs.createReadStream( filePath ) ;

	var data = await jsbindat.unserialize( stream , options , context ) ;
	await stream.close() ;

	return data ;
} ;

