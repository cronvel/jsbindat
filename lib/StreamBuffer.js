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



function StreamBuffer( stream , size ) { return StreamBuffer.create( stream , size ) ; }
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
		rptr: { value: 0 , writable: true , enumerable: true } ,
		
		wbuffer: { value: wsize && Buffer.allocUnsafe( wsize ) , enumerable: true } ,
		wptr: { value: 0 , writable: true , enumerable: true } ,
		wready: { value: true , writable: true , enumerable: true } ,
	} ) ;
	
	Object.defineProperties( self , {
		onDrain: { value: StreamBuffer.onDrain.bind( self ) } ,
	} ) ;
	
	if ( self.wbuffer )
	{
		self.stream.on( 'drain' , self.onDrain ) ;
	}
	
	return self ;
} ;



StreamBuffer.onDrain = function onDrain()
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


/*
StreamBuffer.prototype.readUInt8 = function readUInt8()
{
	if ( this.rptr >= this.rbuffer.length ) { this.flush() ; }
	this.wbuffer.writeUInt8( v , this.wptr ) ;
	this.wptr += 1 ;
} ;
*/


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
StreamBuffer.prototype.writeDoubleLE = function writeDoubleLE( v , callback )
{
	if ( this.wptr >= this.wbuffer.length - 3 )
	{
		if ( ! this.flush() )
		{
			this.stream.on( 'drain' , this.writeDouble.bind( this , v , callback ) ) ;
			return false ;
		}
	}
	
	this.wbuffer.writeDoubleLE( v , this.wptr ) ;
	this.wptr += 8 ;
	
	if ( callback ) { callback() ; }
	return true ;
} ;



StreamBuffer.prototype.writeUInt16 =
StreamBuffer.prototype.writeUInt16LE = function writeUInt16LE( v , callback )
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
	
	this.wbuffer.writeUInt16LE( v , this.wptr ) ;
	this.wptr += 2 ;
	
	if ( callback ) { callback() ; }
	return true ;
} ;



StreamBuffer.prototype.writeUInt32 =
StreamBuffer.prototype.writeUInt32LE = function writeUInt32LE( v , callback )
{
	if ( this.wptr >= this.wbuffer.length - 3 )
	{
		if ( ! this.flush() )
		{
			this.stream.on( 'drain' , this.writeUInt32.bind( this , v , callback ) ) ;
			return false ;
		}
	}
	
	this.wbuffer.writeUInt32LE( v , this.wptr ) ;
	this.wptr += 4 ;
	
	if ( callback ) { callback() ; }
	return true ;
} ;



// LPS: Length prefixed string.
// Store the UTF8 BYTE LENGTH using an UInt32.
StreamBuffer.prototype.writeLpsUtf8 = function writeLpsUtf8( v , callback )
{
	var self = this ;
	
	var ready ,
		byteLength = Buffer.byteLength( v.length , 'utf8' ) ;
	
	// Write the LPS
	if ( ! this.writeUInt32( byteLength ) )
	{
// ----------------------- DO NOT WORK -----------------------------------------------------
		console.log( 'Error!' ) ;
		this.stream.on( 'drain' , this.writeLpsUtf8.bind( this , v , callback ) ) ;
		return false ;
	}
	
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


