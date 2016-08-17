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



StreamBuffer.create = function create( stream , size )
{
	if ( ! size || typeof size !== 'number' || size < 64 ) { size = 1024 ; }
	
	var self = Object.create( StreamBuffer.prototype , {
		stream: { value: stream , enumerable: true } ,
		buffer: { value: Buffer.allocUnsafe( size ) , enumerable: true } ,
		ptr: { value: 0 , writable: true , enumerable: true }
	} ) ;
	
	return self ;
} ;



StreamBuffer.prototype.flush = function flush()
{
	if ( this.ptr < this.buffer.length )
	{
		// Not enough data: slice the buffer
		console.log( 'Write sliced!' ) ;
		this.stream.write( this.buffer.slice( 0 , this.ptr ) ) ;
	}
	else
	{
		// Write the exact buffer content
		console.log( 'Write all!' ) ;
		this.stream.write( this.buffer ) ;
	}
	
	this.ptr = 0 ;
} ;



StreamBuffer.prototype.writeUInt8 = function writeUInt8( v )
{
	if ( this.ptr > this.buffer.length - 2 ) { this.flush() ; }
	this.buffer.writeUInt8( v , this.ptr ) ;
	this.ptr ++ ;
} ;




