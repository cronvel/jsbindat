/*
	JS Binary Data

	Copyright (c) 2016 - 2021 Cédric Ronvel

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



/*
	Describe known-staticly-typed data.
	Allow space-efficient serialization.
*/
function DataModel( proto , type ) {
	this.proto = proto ;
	this.type = type ;
}

module.exports = DataModel ;

DataModel.prototype.isDataModel = true ;
DataModel.prototype.isArray = false ;
DataModel.prototype.fixedLength = false ;



const SCALAR_TYPES = new Set( [
	'number' , 'float32' , 'float64' ,
	'uint8' , 'int8' , 'uint16' , 'int16' , 'uint32' , 'int32' ,
	'lps8string' , 'lps16string' , 'lps32string'
] ) ;



function checkType( type ) {
	if ( typeof type === 'string' ) {
		type = type.toLowerCase() ;
		if ( SCALAR_TYPES.has( type ) ) { return type ; }
		throw new Error( "Unknown scalar type: '" + type + "'" ) ;
	}

	if ( type instanceof DataModel ) { return type ; }

	throw new Error( "Bad type, should be a string or a DataModel" ) ;
}



DataModel.TypedArray = function( proto , ofType ) {
	ofType = checkType( ofType ) ;
	DataModel.call( this , proto , 'typedArray' ) ;
	this.ofType = ofType ;
} ;

DataModel.TypedArray.prototype = Object.create( DataModel.prototype ) ;
DataModel.TypedArray.prototype.constructor = DataModel.TypedArray ;
DataModel.TypedArray.prototype.isArray = true ;



DataModel.FixedTypedArray = function( proto , ofType , length ) {
	ofType = checkType( ofType ) ;
	DataModel.call( this , proto , 'fixedTypedArray' ) ;
	this.ofType = ofType ;
	this.length = length ;
} ;

DataModel.FixedTypedArray.prototype = Object.create( DataModel.prototype ) ;
DataModel.FixedTypedArray.prototype.constructor = DataModel.FixedTypedArray ;
DataModel.FixedTypedArray.prototype.isArray = true ;
DataModel.FixedTypedArray.prototype.fixedLength = true ;



DataModel.SealedObject = function( proto , keyTypePairs ) {
	if ( ! Array.isArray( keyTypePairs ) ) {
		throw new Error( "Argument 'keyTypePairs' should be an array of key-type pairs" ) ;
	}

	for ( let pair of keyTypePairs ) {
		pair[ 1 ] = checkType( pair[ 1 ] ) ;
	}
	
	DataModel.call( this , proto , 'sealedObject' ) ;

	this.keyTypePairs = keyTypePairs ;
} ;

DataModel.SealedObject.prototype = Object.create( DataModel.prototype ) ;
DataModel.SealedObject.prototype.constructor = DataModel.SealedObject ;

