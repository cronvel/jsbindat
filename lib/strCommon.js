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
	TYPE_OPEN: '{' ,		// Open a container (an array or an object)
	TYPE_CLOSE: '}' ,		// Close a container (close an array or an object)
	TYPE_SEPARATOR: ';' ,		// Separator after numbers and strings
	TYPE_REF: '$' ,		// Reference of objects already seen in the current data block
	TYPE_UNSUPPORTED: '?' ,	// Unsupported data (e.g. functions)
	//TYPE_VERSION: 0x07 ,	// Format version

	// Constants
	TYPE_UNDEFINED: 'U' ,
	TYPE_NULL: 'N' ,
	TYPE_FALSE: 'F' ,
	TYPE_TRUE: 'T' ,
	TYPE_ZERO: '0' ,
	TYPE_ONE: '1' ,

	// Numbers
	TYPE_NUMBER: 'n' ,					// Number, end with a ';'

	// Strings
	TYPE_EMPTY_STRING: 'S' ,
	TYPE_STRING_LPS: 's' ,		// String with length stored in digits before it, LPS and string end with a ';'

	// Arrays and the like
	TYPE_EMPTY_ARRAY: 'A' ,
	TYPE_ARRAY: 'a' ,
	TYPE_EMPTY_SET: 'E' ,
	TYPE_SET: 'e' , 					// Stored like an array, but unserialized into a Set

	// Objects and the like
	TYPE_EMPTY_OBJECT: 'O' ,
	TYPE_OBJECT: 'o' ,
	TYPE_EMPTY_MAP: 'M' ,
	TYPE_MAP: 'm' ,
	TYPE_EMPTY_INSTANCE: 'I' ,			// Object of a constructorless class
	TYPE_INSTANCE: 'i' ,				// Object of a constructorless class
	TYPE_CONSTRUCTED_INSTANCE: 'c' ,	// Object of a class that needs a serializer and a constructor/unserializer
	TYPE_PROTOTYPED_OBJECT: 'p' ,		// Object and its prototype

	// Special “opaque” objects
	//TYPE_DATE: 0x80 ,					// Date object

	// Buffer and typed arrays
	TYPE_BUFFER: 'b' ,					// Byte buffer

	// Constants that are known/builtin prototypes
	TYPE_OBJECT_PROTOTYPE: 'P'
} ;

