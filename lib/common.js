/*
	JS Binary Data

	Copyright (c) 2016 - 2018 Cédric Ronvel

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
	// Special codes
	//TYPE_END: 0x00 ,		// End of data block
	TYPE_CLOSE: 0x01 ,		// Close a container (close an array or an object)
	TYPE_REF: 0x04 ,		// Reference of objects already seen in the current data block
	TYPE_UNSUPPORTED: 0x05 ,	// Unsupported data (e.g. functions)
	//TYPE_VERSION: 0x07 ,	// Format version

	// Constants
	TYPE_UNDEFINED: 0x20 ,
	TYPE_NULL: 0x21 ,
	TYPE_FALSE: 0x22 ,
	TYPE_TRUE: 0x23 ,
	TYPE_ZERO: 0x24 ,
	TYPE_ONE: 0x25 ,

	// Numbers
	TYPE_NUMBER: 0x30 ,					// Number = Double
	TYPE_UINT8: 0x31 ,
	TYPE_INT8: 0x32 ,
	TYPE_UINT16: 0x33 ,
	TYPE_INT16: 0x34 ,
	TYPE_UINT32: 0x35 ,
	TYPE_INT32: 0x36 ,

	// Strings
	TYPE_EMPTY_STRING: 0x40 ,
	TYPE_STRING_LPS8_UTF8: 0x41 ,		// Size stored using an UInt8, up to 255B size
	TYPE_STRING_LPS16_UTF8: 0x42 ,		// Size stored using an UInt16, up to 64KiB size
	TYPE_STRING_LPS32_UTF8: 0x43 ,		// Size stored using an UInt32, up to 4GiB size
	//TYPE_STRING_LPS_UCS2: 0x44 ,
	STRING_MASK: 0x40 ,

	// Arrays and the like
	TYPE_EMPTY_ARRAY: 0x50 ,
	TYPE_ARRAY: 0x51 ,
	TYPE_EMPTY_SET: 0x52 ,
	TYPE_SET: 0x53 , 					// Stored like an array, but unserialized into a Set

	// Objects and the like
	TYPE_EMPTY_OBJECT: 0x60 ,
	TYPE_OBJECT: 0x61 ,
	TYPE_EMPTY_MAP: 0x62 ,
	TYPE_MAP: 0x63 ,
	TYPE_EMPTY_INSTANCE: 0x70 ,			// Object of a constructorless class
	TYPE_INSTANCE: 0x71 ,				// Object of a constructorless class
	TYPE_CONSTRUCTED_INSTANCE: 0x73 ,	// Object of a class that needs a serializer and a constructor/unserializer
	TYPE_PROTOTYPED_OBJECT: 0x75 ,		// Object and its prototype

	// Special “opaque” objects
	TYPE_DATE: 0x80 ,					// Date object

	// Buffer and typed arrays
	TYPE_BUFFER: 0x90 ,					// Byte buffer

	// Constants that are known/builtin prototypes
	TYPE_OBJECT_PROTOTYPE: 0xa0
} ;

