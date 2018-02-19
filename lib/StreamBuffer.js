/*
	Stream Kit

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



var EventEmitter = require( 'events' ) ;
var nodeStream = require( 'stream' ) ;
var Promise = require( 'seventh' ) ;



function StreamBuffer( stream , size ) { return StreamBuffer.create( stream , size ) ; }
StreamBuffer.prototype = Object.create( EventEmitter.prototype ) ;
StreamBuffer.prototype.constructor = StreamBuffer ;

module.exports = StreamBuffer ;



function noop() {}



StreamBuffer.create = function create( stream , size ) {
	// Duplex and Transform are instances of Readable, but not of Writable (but they still implement it)
	var readable = ( stream instanceof nodeStream.Readable ) ;
	var writable = ( stream instanceof nodeStream.Writable ) || ( stream instanceof nodeStream.Duplex ) ;

	if ( writable ) {
		if ( ! size || typeof size !== 'number' || size < 64 ) { size = 1024 ; }
	}
	else {
		size = 0 ;
	}

	var self = Object.create( StreamBuffer.prototype , {
		stream: { value: stream , enumerable: true } ,

		readable: { value: readable , enumerable: true } ,
		streamEnded: { value: false , writable: true , enumerable: true } ,

		// Writable
		writable: { value: writable , enumerable: true } ,
		buffer: { value: size && Buffer.allocUnsafe( size ) , enumerable: true } ,
		ptr: { value: 0 , writable: true , enumerable: true } ,
		writeReady: { value: true , writable: true , enumerable: true } ,
		streamWriteReady: { value: true , writable: true , enumerable: true }
	} ) ;

	Object.defineProperties( self , {
		onStreamDrain: { value: StreamBuffer.onStreamDrain.bind( self ) } ,
		onStreamEnd: { value: StreamBuffer.onStreamEnd.bind( self ) } ,
		onNewListener: { value: StreamBuffer.onNewListener.bind( self ) }
	} ) ;

	self.onceAsync = Promise.promisify( self.once , self ) ;
	self.stream.onceAsync = Promise.promisify( self.stream.once , self.stream ) ;

	self.stream.writeAsync = Promise.promisify( self.stream.write , self.stream ) ;
	self.stream.endAsync = Promise.promisify( self.stream.end , self.stream ) ;
	self.stream.closeAsync = Promise.promisify( self.stream.close , self.stream ) ;

	if ( self.writable ) {
		self.stream.on( 'drain' , self.onStreamDrain ) ;
	}

	// Duplex and Transform are instances of Readable, but not Writable (still they implement it)
	if ( self.readable ) {
		self.on( 'newListener' , self.onNewListener ) ;
		self.stream.on( 'end' , self.onStreamEnd ) ;
	}

	return self ;
} ;





/* Read part */



StreamBuffer.prototype.read = async function read( size ) {
	var buffer = this.stream.read( size ) ;

	if ( ! buffer ) {
		await this.stream.onceAsync( 'readable' ) ;
		buffer = this.stream.read( size ) ;
	}

	if ( ! buffer ) {
		throw new Error( "Can't read anymore." ) ;
	}
	
	if ( buffer.length !== size ) {
		throw new Error( "Can't read enough bytes: " + buffer.length + '/' + size ) ;
	}

	return buffer ;
} ;



StreamBuffer.prototype.readNumber =
StreamBuffer.prototype.readDouble =
StreamBuffer.prototype.readDoubleBE = async function readDoubleBE() {
	return ( await this.read( 8 ) ).readDoubleBE( 0 ) ;
} ;



StreamBuffer.prototype.readUInt8 = async function readUInt8() {
	return ( await this.read( 1 ) ).readUInt8( 0 ) ;
} ;



StreamBuffer.onStreamEnd = function onStreamEnd() {
	this.streamEnded = true ;
	this.emit( 'end' ) ;
} ;



StreamBuffer.onNewListener = function onNewListener( eventName ) {
	//console.log( 'onNewListener' , eventName ) ;
	if ( eventName === 'data' ) {
		if ( ! this.isReadingStructure ) { this.readStructure() ; }
	}
} ;





/* Write part */



StreamBuffer.onStreamDrain = function onStreamDrain() {
	this.streamWriteReady = true ;
} ;



StreamBuffer.prototype.flush = async function flush() {
	var buffer ;

	//console.log( "FLUSH required!" ) ;

	if ( ! this.ptr ) { return ; }

	if ( ! this.streamWriteReady ) {
		// We are not ready, do nothing for now, retry on 'drain'
		//console.log( "FLUSH postponed!" ) ;
		this.writeReady = false ;
		await this.stream.onceAsync( 'drain' ) ;
	}

	buffer = this.ptr >= this.buffer.length ? this.buffer : this.buffer.slice( 0 , this.ptr ) ;

	this.writeReady = false ;

	//console.log( "FLUSHING!" , this.streamWriteReady ) ;
	this.streamWriteReady = await this.stream.writeAsync( buffer ) ;
	this.ptr = 0 ;
	this.writeReady = true ;
	//console.log( "FLUSHED!" ) ;
	this.emit( 'flushed' ) ;

} ;



StreamBuffer.prototype.writeNumber =
StreamBuffer.prototype.writeDouble =
StreamBuffer.prototype.writeDoubleBE = async function writeDoubleBE( v ) {
	if ( ! this.writeReady || this.ptr >= this.buffer.length - 7 ) {
		await this.flush() ;
	}

	this.buffer.writeDoubleBE( v , this.ptr ) ;
	this.ptr += 8 ;
} ;



StreamBuffer.prototype.writeUInt8 = async function writeUInt8( v ) {
	if ( ! this.writeReady || this.ptr >= this.buffer.length ) {
		await this.flush() ;
	}

	this.buffer.writeUInt8( v , this.ptr ) ;
	this.ptr += 1 ;
} ;



StreamBuffer.prototype.writeUInt16 =
StreamBuffer.prototype.writeUInt16BE = async function writeUInt16BE( v ) {
	if ( ! this.writeReady || this.ptr >= this.buffer.length - 1 ) {
		await this.flush() ;
	}

	this.buffer.writeUInt16BE( v , this.ptr ) ;
	this.ptr += 2 ;
} ;



StreamBuffer.prototype.writeUInt32 =
StreamBuffer.prototype.writeUInt32BE = async function writeUInt32BE( v ) {
	if ( ! this.writeReady || this.ptr >= this.buffer.length - 3 ) {
		await this.flush() ;
	}

	this.buffer.writeUInt32BE( v , this.ptr ) ;
	this.ptr += 4 ;
} ;



// LPS: Length prefixed string.
// Store the UTF8 BYTE LENGTH using an UInt32.
StreamBuffer.prototype.writeLpsUtf8 = async function writeLpsUtf8( v ) {
	var byteLength = Buffer.byteLength( v , 'utf8' ) ;

	// Write the LPS
	await this.writeUInt32( byteLength ) ;
	await this.writeUtf8( v , byteLength ) ;
} ;



// LPS: Length prefixed string.
// Store the UTF8 BYTE LENGTH using an UInt32.
StreamBuffer.prototype.writeLps8Utf8 = async function writeLps8Utf8( v ) {
	var byteLength = Buffer.byteLength( v , 'utf8' ) ;

	if ( byteLength > 255 ) {
		// Error! What should we do?
		throw new RangeError( 'The string exceed the LPS 8 bits limit' ) ;
	}

	// Write the LPS
	await this.writeUInt8( byteLength ) ;
	await this.writeUtf8( v , byteLength ) ;
} ;



StreamBuffer.prototype.writeUtf8 = async function writeUtf8( v , byteLength ) {
	if ( ! this.writeReady ) {
		await this.flush() ;
	}

	// The string is larger than the buffer, flush the buffer and write the string directly on the stream
	if ( byteLength >= this.buffer.length ) {
		// Always flush, or thing would be in the wrong order!
		await this.flush() ;
		this.streamWriteReady = await this.stream.writeAsync( v , 'utf8' ) ;
		return ;
	}

	// If we can't store the chunk into the buffer, flush it now!
	if ( this.ptr >= this.buffer.length - byteLength + 1 ) {
		//console.log( 'Flush!' ) ;
		await this.flush() ;
	}

	this.buffer.write( v , this.ptr , 'utf8' ) ;
	this.ptr += byteLength ;
} ;



/*
// Like writeLpsUtf8(), but for small string, less than 255B.
StreamBuffer.prototype.writeTinyLpsUtf8 = async function writeTinyLpsUtf8( v , callback )
{
	var byteLength = Buffer.byteLength( v.length , 'utf8' ) ;

	if ( byteLength > 255 ) { throw new RangeError( 'String too big for writeTinyLpsUtf8()' ) ; }

	// Write the LPS
	this.writeUInt8( byteLength ) ;

	if ( byteLength >= this.buffer.length )
	{
		// Always flush
		this.flush() ;

		// Immediately write the stream
		this.stream.write( v , 'utf8' ) ;

		return ;
	}

	// If we can't store the chunk into the buffer, flush it now!
	if ( this.ptr >= this.buffer.length - byteLength + 1 ) { this.flush() ; }

	this.ptr += this.buffer.write( v , this.ptr , 'utf8' ) ;
} ;


// LPS: Length prefixed string.
// Store the UCS2 BYTE LENGTH using an UInt32.
StreamBuffer.prototype.writeLpsUcs2 = async function writeLpsUcs2( v , callback )
{
	var byteLength = v.length * 2 ;

	// Write the LPS
	this.writeUInt32( byteLength ) ;

	if ( byteLength >= this.buffer.length )
	{
		// Always flush
		this.flush() ;

		// Immediately write the stream
		this.stream.write( v , 'ucs2' ) ;

		return ;
	}

	// If we can't store the chunk into the buffer, flush it now!
	if ( this.ptr >= this.buffer.length - byteLength + 1 ) { this.flush() ; }

	this.ptr = this.buffer.write( v , this.ptr , 'ucs2' ) ;
} ;
*/


