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



module.exports = {
	// Special codes
	//TYPE_FILLER: 0x00 ,				// Filler for padding
	TYPE_CLOSE: 0x01 ,					// Close a container (close an array or an object)
	//TYPE_END: 0x02 ,					// End of data block
	TYPE_REF: 0x04 ,					// Reference of objects already seen in the current data block
	TYPE_UNSUPPORTED: 0x05 ,			// Unsupported data
	//TYPE_VERSION: 0x07 ,				// Format version

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
	//TYPE_UINT64: 0x37 ,				// Reserved
	//TYPE_INT64: 0x38 ,				// Reserved
	//TYPE_FLOAT32: 0x39 ,				// Reserved

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
	TYPE_UINT8_ARRAY: 0x91 ,			// Mostly like Buffer except it produces an Uint8Array
	TYPE_INT8_ARRAY: 0x92 ,
	TYPE_UINT16_ARRAY: 0x93 ,
	TYPE_INT16_ARRAY: 0x94 ,
	TYPE_UINT32_ARRAY: 0x95 ,
	TYPE_INT32_ARRAY: 0x96 ,

	// Constants that are known/builtin prototypes
	TYPE_OBJECT_PROTOTYPE: 0xa0 ,

	// Data model
	TYPE_DM_NUMBER_ARRAY: 0xc0 ,
	TYPE_DM_UINT8_ARRAY: 0xc1 ,
	TYPE_DM_INT8_ARRAY: 0xc2 ,
	TYPE_DM_UINT16_ARRAY: 0xc3 ,
	TYPE_DM_INT16_ARRAY: 0xc4 ,
	TYPE_DM_UINT32_ARRAY: 0xc5 ,
	TYPE_DM_INT32_ARRAY: 0xc6 ,
	//TYPE_DM_UINT64: 0xc7 ,				// Reserved
	//TYPE_DM_INT64: 0xc8 ,					// Reserved
	//TYPE_DM_FLOAT32: 0xc9 ,				// Reserved

	// Function/code/...
	TYPE_FUNCTION: 0xf0
} ;

