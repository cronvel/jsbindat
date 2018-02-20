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
	TYPE_CLOSE: 0x01 ,		// Close a container (close an array or an object)

	TYPE_UNDEFINED: 0x20 ,
	TYPE_NULL: 0x21 ,
	TYPE_FALSE: 0x22 ,
	TYPE_TRUE: 0x23 ,

	TYPE_NUMBER: 0x30 ,

	STRING_MASK: 0x40 ,
	TYPE_EMPTY_STRING: 0x40 ,
	TYPE_STRING_LPS8_UTF8: 0x41 ,		// Size stored using an UInt8, up to 255B size
	TYPE_STRING_LPS16_UTF8: 0x42 ,		// Size stored using an UInt16, up to 64KiB size
	TYPE_STRING_LPS32_UTF8: 0x43 ,		// Size stored using an UInt32, up to 4GiB size
	//TYPE_STRING_LPS_UCS2: 0x49 ,

	TYPE_EMPTY_ARRAY: 0x50 ,
	TYPE_ARRAY: 0x51 ,
	TYPE_EMPTY_OBJECT: 0x60 ,
	TYPE_OBJECT: 0x61 ,
	TYPE_EMPTY_INSTANCE: 0x70 ,			// Object of a constructorless class
	TYPE_INSTANCE: 0x71 ,				// Object of a constructorless class
	TYPE_CONSTRUCTED_INSTANCE: 0x72 ,	// Object of a class that needs a constructor/unserializer
	TYPE_REF: 0x80 ,					// Reference an object already seen in the current data block
	TYPE_EMPTY_SET: 0x90 ,
	TYPE_SET: 0x91 					// Stored like an array, but unserialized into a Set
} ;


