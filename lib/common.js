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
	TYPE_CLOSE: 0x00 ,
	TYPE_UNDEFINED: 0x01 ,
	TYPE_NULL: 0x02 ,
	TYPE_FALSE: 0x03 ,
	TYPE_TRUE: 0x04 ,
	TYPE_STRING1: 0x10 ,	// max 255 chars
	TYPE_STRING2: 0x11 ,	// max 65535 chars (64 KiB)
	TYPE_STRING3: 0x12 ,	// max 16777215 chars (16 MiB)
	TYPE_NUMBER: 0x20 ,
	TYPE_ARRAY: 0x30 ,
	TYPE_OBJECT: 0x40
} ;


