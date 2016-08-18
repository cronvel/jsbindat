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

"use strict" ;



//var NextGenEvents = require( 'nextgen-events' ) ;
var EventEmitter = require( 'events' ) ;



function StreamBuffer( stream , size ) { return StreamBuffer.create( stream , size ) ; }
//StreamBuffer.prototype = Object.create( NextGenEvents.prototype ) ;
StreamBuffer.prototype = Object.create( EventEmitter.prototype ) ;
StreamBuffer.prototype.constructor = StreamBuffer ;

module.exports = StreamBuffer ;



function noop() {}



StreamBuffer.create = function create( stream , rsize , wsize )
{
	if ( ! rsize || typeof rsize !== 'number' ) { rsize = null ; }
	else if ( rsize < 64 ) { rsize = 1024 ; }
	
	if ( ! wsize || typeof wsize !== 'number' ) { wsize = null ; }
	else if ( wsize < 64 ) { wsize = 1024 ; }
	
	var self = Object.create( StreamBuffer.prototype , {
		stream: { value: stream , enumerable: true } ,
		
		rbuffer: { value: rsize && Buffer.allocUnsafe( rsize ) , enumerable: true } ,
		riptr: { value: 0 , writable: true , enumerable: true } ,
		roptr: { value: 0 , writable: true , enumerable: true } ,
		
		streamEnded: { value: false , writable: true , enumerable: true } ,
		isReadingStructure: { value: false , writable: true , enumerable: true } ,
		baseStructure: { value: null , writable: true , enumerable: true } ,
		currentStructure: { value: null , writable: true , enumerable: true } ,
		currentIndex: { value: 0 , writable: true , enumerable: true } ,
		currentStructuredData: { value: null , writable: true , enumerable: true } ,
		
		wbuffer: { value: wsize && Buffer.allocUnsafe( wsize ) , enumerable: true } ,
		wptr: { value: 0 , writable: true , enumerable: true } ,
		wready: { value: true , writable: true , enumerable: true } ,
	} ) ;
	
	Object.defineProperties( self , {
		onStreamDrain: { value: StreamBuffer.onStreamDrain.bind( self ) } ,
		onStreamEnd: { value: StreamBuffer.onStreamEnd.bind( self ) } ,
		onNewListener: { value: StreamBuffer.onNewListener.bind( self ) } ,
	} ) ;
	
	if ( self.wbuffer )
	{
		self.stream.on( 'drain' , self.onStreamDrain ) ;
	}
	
	if ( self.rbuffer )
	{
		self.on( 'newListener' , self.onNewListener ) ;
		self.stream.on( 'end' , self.onStreamEnd ) ;
	}
	
	
	//if ( self.rbuffer ) { self.stream.on( 'data' , self.onData ) ; }
	
	return self ;
} ;





			/* Read part */



StreamBuffer.prototype.defineStructure = function defineStructure( structure )
{
	//structure.forEach( e => StreamBuffer.createDataType( e ) ) ;
	this.baseStructure = structure ;
} ;



StreamBuffer.prototype.readStructure = function readStructure()
{
	if ( this.isReadingStructure ) { return ; }
	
	this.prepareNextDataIteration() ;
	this.readData() ;
} ;



StreamBuffer.prototype.prepareNextDataIteration = function prepareNextDataIteration()
{
	// First, copy the base structure: most structure are dynamic
	this.currentStructure = this.baseStructure.slice() ;
	this.currentIndex = 0 ;
	this.currentStructuredData = {} ;
} ;



StreamBuffer.prototype.readData = function readData( fromReadableEvent )
{
	var data , dataType ;
	
	// No recursivity: avoid stack overflow
	
	while ( true )
	{
		while ( this.currentIndex < this.currentStructure.length )
		{
			dataType = this.currentStructure[ this.currentIndex ] ;
			
			data = this.stream.read( dataType.size ) ;
			
			if ( data === null )
			{
				// No data was read, retry when readable again...
				// If we are at the end of the stream, no more 'readable' event will ever be fired...
				this.stream.once( 'readable' , this.readData.bind( this , true ) ) ;
				return ;
			}
			
			data = data[ dataType.readBufferFn ]() ;
			
			if ( dataType.handler )
			{
				data = dataType.handler( data , dataType , this.currentStructuredData , this.currentStructure , this.currentIndex ) ;
			}
			
			this.currentStructuredData[ dataType.key ] = data ;
			this.currentIndex ++ ;
		}
		
		// We have collected all data for this structured data
		this.emit( 'data' , this.currentStructuredData ) ;
		
		// Reset everything for the next iteration
		this.prepareNextDataIteration() ;
	}
} ;



StreamBuffer.types = {
	uint8: { size: 1 , readBufferFn: 'readUInt8' } ,
	uint16: { size: 2 , readBufferFn: 'readUInt16BE' } ,
	uint32: { size: 4 , readBufferFn: 'readUInt32BE' } ,
	double: { size: 8 , readBufferFn: 'readDoubleBE' } ,
	utf8: { readBufferFn: 'toString' } ,
} ;

// Aliases
StreamBuffer.types.number = StreamBuffer.types.double ;



StreamBuffer.createDataType = function createDataType( dataType )
{
	if ( ! StreamBuffer.types[ dataType.type ] ) { throw new TypeError( 'Unknown data type: ' + dataType.type ) ; }
	if ( ! dataType.key ) { throw new TypeError( 'A key is needed for each data type' ) ; }
	if ( ! dataType.size ) { dataType.size = StreamBuffer.types[ dataType.type ].size ; }
	
	//if ( ! dataType.readBufferFn ) { dataType.readBufferFn = StreamBuffer.types[ dataType.type ].readBufferFn ; }
	dataType.readBufferFn = StreamBuffer.types[ dataType.type ].readBufferFn ;
	
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
	this.wready = true ;
} ;



StreamBuffer.prototype.flush = function flush( callback )
{
	var ready ;
	
	if ( ! this.wptr )
	{
		// Nothing to flush
		console.log( 'Nothing to flush!' ) ;
		if ( callback ) { callback() ; }
		return true ;
	}
	
	if ( ! this.wready )
	{
		// We are not ready, do nothing for now, retry on 'drain'
		this.stream.on( 'drain' , this.flush.bind( this , callback ) ) ;
		return false ;
	}
	
	if ( this.wptr < this.wbuffer.length )
	{
		// Not enough data: slice the wbuffer
		console.log( 'Write sliced!' , this.wptr ) ;
		this.wready = this.stream.write( this.wbuffer.slice( 0 , this.wptr ) ) ;
	}
	else
	{
		// Write the exact wbuffer content
		console.log( 'Write all!' ) ;
		this.wready = this.stream.write( this.wbuffer ) ;
	}
	
	this.wptr = 0 ;
	
	// Always return true here, because the buffer is emptied, so write are okey
	if ( callback ) { callback() ; }
	return true ;
	
	/*
	if ( callback )
	{
		if ( this.wready ) { callback() ; }
		else { this.stream.once( 'drain' , callback ) ; }
	}
	
	return this.wready ;
	*/
} ;



StreamBuffer.prototype.writeUInt8 = function writeUInt8( v , callback )
{
	if ( this.wptr >= this.wbuffer.length )
	{
		if ( ! this.flush() )
		{
			this.stream.on( 'drain' , this.writeUInt8.bind( this , v , callback ) ) ;
			return false ;
		}
	}
	
	this.wbuffer.writeUInt8( v , this.wptr ) ;
	this.wptr += 1 ;
	
	if ( callback ) { callback() ; }
	return true ;
} ;



StreamBuffer.prototype.writeNumber =
StreamBuffer.prototype.writeDouble =
StreamBuffer.prototype.writeDoubleBE = function writeDoubleBE( v , callback )
{
	if ( this.wptr >= this.wbuffer.length - 3 )
	{
		if ( ! this.flush() )
		{
			this.stream.on( 'drain' , this.writeDouble.bind( this , v , callback ) ) ;
			return false ;
		}
	}
	
	this.wbuffer.writeDoubleBE( v , this.wptr ) ;
	this.wptr += 8 ;
	
	if ( callback ) { callback() ; }
	return true ;
} ;



StreamBuffer.prototype.writeUInt16 =
StreamBuffer.prototype.writeUInt16BE = function writeUInt16BE( v , callback )
{
	if ( this.wptr >= this.wbuffer.length - 1 )
	{
		if ( ! this.flush() )
		{
			this.stream.on( 'drain' , this.writeUInt16.bind( this , v , callback ) ) ;
			return false ;
		}
	}
	
	if ( this.wptr >= this.wbuffer.length - 1 ) { return this.flush( this.writeUInt16.bind( this , v , callback ) ) ; }
	
	this.wbuffer.writeUInt16BE( v , this.wptr ) ;
	this.wptr += 2 ;
	
	if ( callback ) { callback() ; }
	return true ;
} ;



StreamBuffer.prototype.writeUInt32 =
StreamBuffer.prototype.writeUInt32BE = function writeUInt32BE( v , callback )
{
	if ( this.wptr >= this.wbuffer.length - 3 )
	{
		if ( ! this.flush() )
		{
			this.stream.on( 'drain' , this.writeUInt32.bind( this , v , callback ) ) ;
			return false ;
		}
	}
	
	this.wbuffer.writeUInt32BE( v , this.wptr ) ;
	this.wptr += 4 ;
	
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
		console.log( 'Error!' ) ;
		this.stream.on( 'drain' , this.writeUtf8.bind( this , v , byteLength , callback ) ) ;
		return false ;
	}
	
	return this.writeUtf8( v , byteLength , callback ) ;
} ;



StreamBuffer.prototype.writeUtf8 = function writeUtf8( v , byteLength , callback )
{
	var self = this ;
	
	if ( byteLength >= this.wbuffer.length )
	{
		// Always flush
		if ( ! this.flush() )
		{
			this.stream.on( 'drain' , function() {
				self.stream.write( v , 'utf8' , callback ) ;
			} ) ;
			return false ;
		}
		
		// Immediately write the stream
		return this.stream.write( v , 'utf8' , callback ) ;
	}
	
	// If we can't store the chunk into the wbuffer, flush it now!
	if ( this.wptr >= this.wbuffer.length - byteLength + 1 )
	{
		console.log( 'Flush!' ) ;
		if ( ! this.flush() )
		{
			this.stream.on( 'drain' , function() {
				self.wptr += self.wbuffer.write( v , self.wptr , 'utf8' ) ;
				if ( callback ) { callback() ; }
			} ) ;
			return false ;
		}
	}
	
	this.wptr += this.wbuffer.write( v , this.wptr , 'utf8' ) ;
	
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
	
	if ( byteLength >= this.wbuffer.length )
	{
		// Always flush
		this.flush() ;
		
		// Immediately write the stream
		this.stream.write( v , 'utf8' ) ;
		
		return ;
	}
	
	// If we can't store the chunk into the wbuffer, flush it now!
	if ( this.wptr >= this.wbuffer.length - byteLength + 1 ) { this.flush() ; }
	
	this.wptr += this.wbuffer.write( v , this.wptr , 'utf8' ) ;
} ;


// LPS: Length prefixed string.
// Store the UCS2 BYTE LENGTH using an UInt32.
StreamBuffer.prototype.writeLpsUcs2 = function writeLpsUcs2( v , callback )
{
	var byteLength = v.length * 2 ;
	
	// Write the LPS
	this.writeUInt32( byteLength ) ;
	
	if ( byteLength >= this.wbuffer.length )
	{
		// Always flush
		this.flush() ;
		
		// Immediately write the stream
		this.stream.write( v , 'ucs2' ) ;
		
		return ;
	}
	
	// If we can't store the chunk into the wbuffer, flush it now!
	if ( this.wptr >= this.wbuffer.length - byteLength + 1 ) { this.flush() ; }
	
	this.wptr = this.wbuffer.write( v , this.wptr , 'ucs2' ) ;
} ;
*/


