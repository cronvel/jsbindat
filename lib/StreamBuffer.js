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



StreamBuffer.create = function create( stream , size )
{
	// Duplex and Transform are instances of Readable, but not of Writable (but they still implement it)
	var readable = ( stream instanceof nodeStream.Readable ) ;
	var writable = ( stream instanceof nodeStream.Writable ) || ( stream instanceof nodeStream.Duplex ) ;
	
	if ( writable )
	{
		if ( ! size || typeof size !== 'number' || size < 64 ) { size = 1024 ; }
	}
	else
	{
		size = 0 ;
	}
	
	var self = Object.create( StreamBuffer.prototype , {
		stream: { value: stream , enumerable: true } ,
		
		readable: { value: readable , enumerable: true } ,
		isReadingStructure: { value: false , writable: true , enumerable: true } ,
		baseStructure: { value: null , writable: true , enumerable: true } ,
		userContext: { value: null , writable: true , enumerable: true } ,
		streamEnded: { value: false , writable: true , enumerable: true } ,
		
		// Writable
		writable: { value: writable , enumerable: true } ,
		buffer: { value: size && Buffer.allocUnsafe( size ) , enumerable: true } ,
		ptr: { value: 0 , writable: true , enumerable: true } ,
		writeReady: { value: true , writable: true , enumerable: true } ,
		streamWriteReady: { value: true , writable: true , enumerable: true } ,
	} ) ;
	
	Object.defineProperties( self , {
		onStreamDrain: { value: StreamBuffer.onStreamDrain.bind( self ) } ,
		onStreamEnd: { value: StreamBuffer.onStreamEnd.bind( self ) } ,
		onNewListener: { value: StreamBuffer.onNewListener.bind( self ) } ,
	} ) ;
	
	self.onceAsync = Promise.promisify( self.once , self ) ;
	self.stream.onceAsync = Promise.promisify( self.stream.once , self.stream ) ;
	self.stream.writeAsync = Promise.promisify( self.stream.write , self.stream ) ;
	self.stream.endAsync = Promise.promisify( self.stream.end , self.stream ) ;
	
	if ( self.writable )
	{
		self.stream.on( 'drain' , self.onStreamDrain ) ;
	}
	
	// Duplex and Transform are instances of Readable, but not Writable (still they implement it)
	if ( self.readable )
	{
		self.on( 'newListener' , self.onNewListener ) ;
		self.stream.on( 'end' , self.onStreamEnd ) ;
	}
	
	return self ;
} ;





			/* Read part */



StreamBuffer.prototype.defineStructure = function defineStructure( structure , userContext )
{
	//structure.forEach( e => StreamBuffer.createDataType( e ) ) ;
	this.baseStructure = structure ;
	this.userContext = userContext ;
} ;



StreamBuffer.prototype.readStructure = function readStructure()
{
	if ( this.isReadingStructure ) { return ; }
	
	var ctx = {
		baseStructure: this.baseStructure
	} ;
	
	this.prepareNextDataIteration( ctx ) ;
	this.readData( [ ctx ] ) ;
} ;



StreamBuffer.prototype.prepareNextDataIteration = function prepareNextDataIteration( ctx )
{
	// First, copy the base structure: most structure are dynamic
	ctx.closed = false ;
	ctx.structure = ctx.baseStructure.slice() ;
	ctx.index = 0 ;
	ctx.structuredData = {} ;
} ;



StreamBuffer.prototype.readData = function readData( ctxStack , fromReadableEvent )
{
	var data , ctx , dataType , nextCtx , parentCtx , parentDataType ;
	
	// No recursivity: avoid stack overflow
	
	while ( true )
	{
		ctx = ctxStack[ ctxStack.length - 1 ] ;
		
		while ( ctx.index < ctx.structure.length )
		{
			dataType = ctx.structure[ ctx.index ] ;
			
			if ( dataType.open )
			{
				//console.log( '>>>>> OPENED! ' ) ; //, dataType ) ;
				
				nextCtx = {
					baseStructure: this.baseStructure ,
					structuredDataList: [] ,
					parent: ctx
				} ;
				
				this.prepareNextDataIteration( nextCtx ) ;
				ctxStack.push( nextCtx ) ;
				ctx = nextCtx ;
				continue ;
			}
			
			data = this.stream.read( dataType.size ) ;
			
			if ( data === null )
			{
				// No data was read, retry when readable again...
				// If we are at the end of the stream, no more 'readable' event will ever be fired...
				this.stream.once( 'readable' , this.readData.bind( this , ctxStack , true ) ) ;
				return ;
			}
			
			data = data[ dataType.readBufferFn ]() ;
			
			// Cascading context closing
			while ( true )
			{
				if ( dataType.handler )
				{
					//data = dataType.handler( data , dataType , ctx.structuredData , ctx.structure , ctx.index ) ;
					data = dataType.handler( data , dataType , ctx , this.userContext ) ;
				}
				
				// ctx.closed is only set by dataType.handler()
				if ( ! ctx.closed ) { break ; }
				
				// The end of the loop handle the context closing
				
				if ( ctxStack.length <= 1 )
				{
					// We should not close here, this is an error, what should we do?
					this.emit( 'error' , new Error( "StreamBuffer: 'closed' data type at top-level" ) ) ;
					return ;
				}
				
				data = ctx.structuredDataList ;
				ctxStack.pop() ;
				ctx = ctxStack[ ctxStack.length - 1 ] ;
				dataType = ctx.structure[ ctx.index ] ;
				
				//console.log( '>>>>> CLOSED! ' ) ; //, dataType ) ;
			}
			
			ctx.structuredData[ dataType.key ] = data ;
			ctx.index ++ ;
		}
		
		// We have collected all data for this structured data.
		// This is one atomic data element.
		
		if ( ctxStack.length > 1 )
		{
			ctx.structuredDataList.push( ctx.structuredData ) ;
			
			//console.log( "Got this structured data: " , ctx.structuredData ) ;
			
			// Partial handlers
			if (
				( parentCtx = ctx.parent ) &&
				( parentDataType = parentCtx.structure[ parentCtx.index ] ) &&
				parentDataType.partialHandlers &&
				parentDataType.partialHandlers[ ctx.structuredDataList.length - 1 ]
			)
			{
				//console.log( "***" , ctx.structuredDataList ) ;
				parentDataType.partialHandlers[ ctx.structuredDataList.length - 1 ](
					ctx.structuredDataList , parentDataType , parentCtx , this.userContext
				) ;
			}
		}
		else
		{
			this.emit( 'data' , ctx.structuredData ) ;
		}
		
		// Reset everything for the next iteration
		this.prepareNextDataIteration( ctx ) ;
	}
} ;



StreamBuffer.types = {
	uint8: { size: 1 , readBufferFn: 'readUInt8' } ,
	uint16: { size: 2 , readBufferFn: 'readUInt16BE' } ,
	uint32: { size: 4 , readBufferFn: 'readUInt32BE' } ,
	double: { size: 8 , readBufferFn: 'readDoubleBE' } ,
	utf8: { readBufferFn: 'toString' } ,
	open: { open: true } ,
//	closed: { closed: true }
} ;

// Aliases
StreamBuffer.types.number = StreamBuffer.types.double ;



StreamBuffer.createDataType = function createDataType( dataType )
{
	var type = StreamBuffer.types[ dataType.type ] ;
	
	if ( ! type ) { throw new TypeError( 'Unknown data type: ' + dataType.type ) ; }
	if ( ! dataType.size ) { dataType.size = type.size ; }
	if ( ! dataType.key ) { throw new TypeError( 'Data type needs a key property' ) ; }
	//dataType.key = dataType.key || null ;
	
	//if ( ! dataType.readBufferFn ) { dataType.readBufferFn = type.readBufferFn ; }
	dataType.readBufferFn = type.readBufferFn ;
	
	dataType.open = type.open ;
	
	return dataType ;
} ;



StreamBuffer.onStreamEnd = function onStreamEnd()
{
	this.streamEnded = true ;
	this.emit( 'end' ) ;
} ;



StreamBuffer.onNewListener = function onNewListener( eventName )
{
	//console.log( 'onNewListener' , eventName ) ;
	if ( eventName === 'data' )
	{
		if ( ! this.isReadingStructure ) { this.readStructure() ; }
	}
} ;





			/* Write part */



StreamBuffer.onStreamDrain = function onStreamDrain()
{
	this.streamWriteReady = true ;
} ;



StreamBuffer.prototype.flush = function flush( callback )
{
	var self = this , streamWriteReady , buffer ;
	
	//console.log( "FLUSH required!" ) ;
	
	if ( ! this.ptr )
	{
		// Nothing to flush
		//console.log( 'Nothing to flush!' ) ;
		if ( callback ) { callback() ; }
		return true ;
	}
	
	if ( ! this.streamWriteReady )
	{
		// We are not ready, do nothing for now, retry on 'drain'
		//console.log( "FLUSH postponed!" ) ;
		this.stream.once( 'drain' , this.flush.bind( this , callback ) ) ;
		this.writeReady = false ;
		return false ;
	}
	
	if ( this.ptr < this.buffer.length )
	{
		// Not enough data: slice the buffer
		//console.log( 'Write sliced!' , this.ptr ) ;
		buffer = this.buffer.slice( 0 , this.ptr ) ;
	}
	else
	{
		// Write the exact buffer content
		//console.log( 'Write all!' ) ;
		buffer = this.buffer ;
	}
	
	this.writeReady = false ;
	
	// DO NOT USE THE BUFFER UNTIL THE .write()'s CALLBACK IS TRIGGERED!
	
	this.streamWriteReady = this.stream.write( buffer , function() {
		self.ptr = 0 ;
		self.writeReady = true ;
		//console.log( "FLUSHED!" ) ;
		if ( callback ) { callback() ; }
		self.emit( 'flushed' ) ;
	} ) ;
	
	//console.log( "FLUSHING!" , this.streamWriteReady ) ;
	
	return false ;
	
	/*	Multiple buffers variant
	this.buffer = Buffer.allocUnsafe( this.buffer.length ) ;
	this.ptr = 0 ;
	
	// Always return true here, because the buffer is emptied, so write are okey
	this.writeReady = true ;
	if ( callback ) { callback() ; }
	return true ;
	//*/
} ;



StreamBuffer.prototype.flush = async function flush()
{
	var buffer ;
	
	//console.log( "FLUSH required!" ) ;
	
	if ( ! this.ptr ) { return ; }
	
	if ( ! this.streamWriteReady )
	{
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
StreamBuffer.prototype.writeDoubleBE = async function writeDoubleBE( v )
{
	if ( ! this.writeReady || this.ptr >= this.buffer.length -7 ) {
		await this.flush() ;
	}
	
	this.buffer.writeDoubleBE( v , this.ptr ) ;
	this.ptr += 8 ;
} ;



StreamBuffer.prototype.writeUInt8 = async function writeUInt8( v )
{
	if ( ! this.writeReady || this.ptr >= this.buffer.length ) {
		await this.flush() ;
	}
	
	this.buffer.writeUInt8( v , this.ptr ) ;
	this.ptr += 1 ;
} ;



StreamBuffer.prototype.writeUInt16 =
StreamBuffer.prototype.writeUInt16BE = function writeUInt16BE( v , callback )
{
	if ( ! this.writeReady || ( this.ptr >= this.buffer.length -1 && ! this.flush() ) )
	{
		this.once( 'flushed' , this.writeUInt16.bind( this , v , callback ) ) ;
		return false ;
	}
	
	this.buffer.writeUInt16BE( v , this.ptr ) ;
	this.ptr += 2 ;
	
	if ( callback ) { callback() ; }
	return true ;
} ;



StreamBuffer.prototype.writeUInt32 =
StreamBuffer.prototype.writeUInt32BE = function writeUInt32BE( v , callback )
{
	if ( ! this.writeReady || ( this.ptr >= this.buffer.length -3 && ! this.flush() ) )
	{
		this.once( 'flushed' , this.writeUInt32.bind( this , v , callback ) ) ;
		return false ;
	}
	
	this.buffer.writeUInt32BE( v , this.ptr ) ;
	this.ptr += 4 ;
	
	if ( callback ) { callback() ; }
	return true ;
} ;



// LPS: Length prefixed string.
// Store the UTF8 BYTE LENGTH using an UInt32.
StreamBuffer.prototype.writeLpsUtf8 = function writeLpsUtf8( v , callback )
{
	var byteLength = Buffer.byteLength( v , 'utf8' ) ;
	
	// Write the LPS
	if ( ! this.writeUInt32( byteLength ) )
	{
		this.once( 'flushed' , this.writeUtf8.bind( this , v , byteLength , callback ) ) ;
		return false ;
	}
	
	return this.writeUtf8( v , byteLength , callback ) ;
} ;



// LPS: Length prefixed string.
// Store the UTF8 BYTE LENGTH using an UInt32.
StreamBuffer.prototype.writeLps8Utf8 = function writeLps8Utf8( v , callback )
{
	var byteLength = Buffer.byteLength( v , 'utf8' ) ;
	
	if ( byteLength > 255 )
	{
		// Error! What should we do?
		throw new RangeError( 'The string exceed the LPS 8 bits limit' ) ;
	}
	
	// Write the LPS
	if ( ! this.writeUInt8( byteLength ) )
	{
		this.once( 'flushed' , this.writeUtf8.bind( this , v , byteLength , callback ) ) ;
		return false ;
	}
	
	return this.writeUtf8( v , byteLength , callback ) ;
} ;



StreamBuffer.prototype.writeUtf8 = function writeUtf8( v , byteLength , callback )
{
	var self = this ;
	
	if ( ! this.writeReady )
	{
		this.once( 'flushed' , this.writeUtf8.bind( this , v , byteLength , callback ) ) ;
		return false ;
	}
	
	// The string is larger than the buffer, flush the buffer and write the string directly on the stream
	if ( byteLength >= this.buffer.length )
	{
		// Always flush
		if ( ! this.flush() )
		{
			this.once( 'flushed' , function() {
				self.stream.write( v , 'utf8' , callback ) ;
			} ) ;
			return false ;
		}
		
		// Immediately write the stream
		return this.stream.write( v , 'utf8' , callback ) ;
	}
	
	// If we can't store the chunk into the buffer, flush it now!
	if ( this.ptr >= this.buffer.length - byteLength + 1 )
	{
		//console.log( 'Flush!' ) ;
		if ( ! this.flush() )
		{
			this.once( 'flushed' , function() {
				self.ptr += self.buffer.write( v , self.ptr , 'utf8' ) ;
				if ( callback ) { callback() ; }
			} ) ;
			return false ;
		}
	}
	
	this.ptr += this.buffer.write( v , this.ptr , 'utf8' ) ;
	
	if ( callback ) { callback() ; }
	return true ;
} ;



/*
// Like writeLpsUtf8(), but for small string, less than 255B.
StreamBuffer.prototype.writeTinyLpsUtf8 = function writeTinyLpsUtf8( v , callback )
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
StreamBuffer.prototype.writeLpsUcs2 = function writeLpsUcs2( v , callback )
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

