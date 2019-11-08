/*
	JS Binary Data

	Copyright (c) 2016 - 2019 Cédric Ronvel

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



function KVStore( file = null ) {
	this.file = file ;
	this.map = new Map() ;
	this.freeSpaces = [] ;	// Store spaces that have been freed in the middle of the file
}

module.exports = KVStore ;



KVStore.prototype.has = function( key ) {
	return this.map.has( key ) ;
} ;



KVStore.prototype.get = function( key ) {
	var mapV = this.map.get( key ) ;
	if ( ! mapV ) { return ; }
	return mapV.v ;
} ;



KVStore.prototype.set = function( key , value ) {
	var offset ,
		mapV = this.map.get( key ) ;

	if ( mapV ) {
		mapV.v  = value ;
		offset = this.updateDB( mapV.o , key , value ) ;
		if ( offset !== undefined ) { mapV.o = offset ; }
	}
	else {
		offset = this.insertDB( key , value ) ;
		this.map.set( key , { v: value , o: offset } ) ;
	}
} ;



KVStore.prototype.delete = function( key ) {
	var offset ,
		mapV = this.map.get( key ) ;

	if ( mapV ) {
		this.deleteDB( mapV.o ) ;
		this.map.delete( key ) ;
	}
} ;



KVStore.prototype.insertDB = async function( key , value ) {
	if ( ! this.file ) { return ; }
	this.file.stats
} ;



KVStore.prototype.updateDB = async function( offset , key , value ) {
	if ( ! this.file ) { return ; }
} ;



KVStore.prototype.deleteDB = async function( offset , key , value ) {
	if ( ! this.file ) { return ; }
} ;

