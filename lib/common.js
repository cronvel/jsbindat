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


module.exports = {
	TYPE_END: 0x00 ,		// End of object serialization
	
	TYPE_UNDEFINED: 0x20 ,
	TYPE_NULL: 0x21 ,
	TYPE_FALSE: 0x22 ,
	TYPE_TRUE: 0x23 ,
	TYPE_EMPTY_STRING: 0x30 ,
	TYPE_TINY_STRING_LPS_UTF8: 0x31 ,	// size stored using an UInt8, up to 255B size
	TYPE_STRING_LPS_UTF8: 0x32 ,		// size stored using an UInt32, up to 4GiB size
	TYPE_STRING_LPS_UCS2: 0x33 ,		// size stored using an UInt32, up to 4GiB size
	TYPE_NUMBER: 0x40 ,
	TYPE_ARRAY: 0x50 ,
	TYPE_OBJECT: 0x60
} ;


