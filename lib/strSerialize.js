/*
	JS Binary Data

	Copyright (c) 2016 - 2019 Cédric Ronvel

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



const ClassMap = require( './ClassMap.js' ) ;
const common = require( './strCommon.js' ) ;

//function noop() {}



function serialize( v , options ) {
	options = options || {} ;
	var classMap = options.classMap ;
	if ( classMap && ! ( classMap instanceof ClassMap ) ) { classMap = new ClassMap( classMap ) ; }

	var runtime = {
		str: '' ,
		universal: options.universal ,
		classMap: classMap ,
		autoInstance: options.autoInstance ,
		prototypeChain: options.prototypeChain ,
		refCount: 0	,
		refs: new WeakMap()
	} ;

	serializeAnyType( v , runtime ) ;
	return runtime.str ;
}



module.exports = serialize ;



function serializeAnyType( v , runtime ) {
	switch ( v ) {
		case undefined :
			runtime.str += common.TYPE_UNDEFINED ;
			return ;
		case null :
			runtime.str += common.TYPE_NULL ;
			return ;
		case true :
			runtime.str += common.TYPE_TRUE ;
			return ;
		case false :
			runtime.str += common.TYPE_FALSE ;
			return ;

		// Prototype constants
		case Object.prototype :
			runtime.str += common.TYPE_OBJECT_PROTOTYPE ;
			return ;
	}

	switch ( typeof v ) {
		case 'number' :
			return serializeNumber( v , runtime ) ;
		case 'string' :
			return serializeString( v , runtime ) ;
		case 'object' :
			return serializeAnyObject( v , runtime ) ;
		case 'function' :
			return serializeFunction( v , runtime ) ;
	}

	// Unsupported data
	runtime.str += common.TYPE_UNSUPPORTED ;
}



function serializeNumber( v , runtime ) {
	// We could store anything in the "number" type, but this way it takes more space than JSON (8 bytes per number).
	// Instead, we try to detect if a number is an integer to use the appropriate binary type.

	if ( v === 0 ) {
		runtime.str += common.TYPE_ZERO ;
	}
	else if ( v === 1 ) {
		runtime.str += common.TYPE_ONE ;
	}
	else {
		// Floating point number
		runtime.str += common.TYPE_NUMBER + v + common.TYPE_SEPARATOR ;
	}
}



function serializeString( v , runtime ) {
	if ( v ) {
		runtime.str += common.TYPE_STRING_LPS + v.length + common.TYPE_SEPARATOR + v + common.TYPE_SEPARATOR ;
	}
	else {
		runtime.str += common.TYPE_EMPTY_STRING ;
	}
}



function serializeFunction( v , runtime ) {
	// Of course, it doesn't work if it contains scope variable
	var s = v.toString() ;
	runtime.str += common.TYPE_FUNCTION + s.length + common.TYPE_SEPARATOR + s + common.TYPE_SEPARATOR ;
}



function serializeAnyObject( v , runtime ) {
	var className , classData , objectData ,
		proto = Object.getPrototypeOf( v ) ;

	var refId = runtime.refs.get( v ) ;

	if ( refId !== undefined ) {
		runtime.str += common.TYPE_REF + refId + common.TYPE_SEPARATOR ;
		return ;
	}

	if ( Array.isArray( v ) ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeArray( v , runtime ) ;
	}

	if ( proto === Object.prototype || proto === null ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeStrictObject( v , runtime ) ;
	}

	if ( proto === Set.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeSet( v , runtime ) ;
	}

	if ( proto === Map.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeMap( v , runtime ) ;
	}

	if ( proto === Date.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeDate( v , runtime ) ;
	}

	if ( proto === Buffer.prototype ) {
		runtime.refs.set( v , runtime.refCount ++ ) ;
		return serializeBuffer( v , runtime ) ;
	}

	if ( runtime.classMap && ( className = runtime.classMap.prototypeMap.get( proto ) ) ) {
		classData = runtime.classMap.classes[ className ] ;
	}
	else if ( runtime.universal ) {
		classData = runtime.universal ;

		// Default className, if not provided by the universal serializer...
		if ( typeof proto.constructor === 'function' ) { className = proto.constructor.name ; }
	}
	else if ( runtime.autoInstance && typeof proto.constructor === 'function' ) {
		className = proto.constructor.name ;
		classData = proto.constructor ;
	}

	if ( classData ) {
		if ( classData.serializer ) {
			// We let .serializeConstructedInstance() handle ref, because it is possible that args === v
			//runtime.refs.set( v , runtime.refCount ++ ) ;

			objectData = classData.serializer( v ) ;

			if ( objectData && typeof objectData === 'object' ) {
				if ( ! objectData.className ) { objectData.className = className ; }
				return serializeConstructedInstance( v , objectData , runtime ) ;
			}
			// Else we serialize it like a regular object
		}
		else {
			runtime.refs.set( v , runtime.refCount ++ ) ;
			return serializeInstance( v , className , runtime ) ;
		}
	}

	if ( runtime.prototypeChain ) {
		//runtime.refs.set( v , runtime.refCount ++ ) ;		// Nope! the prototype should be refered first!
		return serializePrototypedObject( v , proto , runtime ) ;
	}

	runtime.refs.set( v , runtime.refCount ++ ) ;
	return serializeStrictObject( v , runtime ) ;
}



function serializeArray( v , runtime ) {
	var element ;

	if ( ! v.length ) {
		runtime.str += common.TYPE_EMPTY_ARRAY ;
		return ;
	}

	runtime.str += common.TYPE_ARRAY + common.TYPE_OPEN ;

	for ( element of v ) {
		//console.log( "Serialize" , element ) ;
		serializeAnyType( element , runtime ) ;
	}

	runtime.str += common.TYPE_CLOSE ;
	//console.log( "after close" ) ;
}



function serializeSet( v , runtime ) {
	var element ;

	if ( ! v.size ) {
		runtime.str += common.TYPE_EMPTY_SET ;
		return ;
	}

	runtime.str += common.TYPE_SET + common.TYPE_OPEN ;

	for ( element of v ) {
		serializeAnyType( element , runtime ) ;
	}

	runtime.str += common.TYPE_CLOSE ;
}



function serializeStrictObject( v , runtime ) {
	var keys , key ;

	keys = Object.keys( v ) ;

	if ( ! keys.length ) {
		runtime.str += common.TYPE_EMPTY_OBJECT ;
		return ;
	}

	runtime.str += common.TYPE_OBJECT + common.TYPE_OPEN ;

	for ( key of keys ) {
		serializeAnyType( key , runtime ) ;
		serializeAnyType( v[ key ] , runtime ) ;
	}

	runtime.str += common.TYPE_CLOSE ;
}



function serializePrototypedObject( v , proto , runtime ) {
	var keys , key ;

	keys = Object.keys( v ) ;

	runtime.str += common.TYPE_PROTOTYPED_OBJECT + common.TYPE_OPEN ;
	serializeAnyType( proto , runtime ) ;

	// Add the ref AFTER its prototype chain!
	runtime.refs.set( v , runtime.refCount ++ ) ;

	for ( key of keys ) {
		serializeAnyType( key , runtime ) ;
		serializeAnyType( v[ key ] , runtime ) ;
	}

	runtime.str += common.TYPE_CLOSE ;
}



function serializeMap( v , runtime ) {
	var pair ;

	if ( ! v.size ) {
		runtime.str += common.TYPE_EMPTY_MAP ;
		return ;
	}

	runtime.str += common.TYPE_MAP + common.TYPE_OPEN ;

	for ( pair of v ) {
		serializeAnyType( pair[ 0 ] , runtime ) ;
		serializeAnyType( pair[ 1 ] , runtime ) ;
	}

	runtime.str += common.TYPE_CLOSE ;
}



function serializeInstance( v , className , runtime ) {
	var keys , key ;

	keys = Object.keys( v ) ;

	runtime.str += common.TYPE_INSTANCE + common.TYPE_OPEN ;
	serializeString( className , runtime ) ;

	for ( key of keys ) {
		serializeAnyType( key , runtime ) ;
		serializeAnyType( v[ key ] , runtime ) ;
	}

	runtime.str += common.TYPE_CLOSE ;
}



function serializeConstructedInstance( v , objectData , runtime ) {
	var keys , key , override ,
		instanceId = runtime.refCount ++ ;

	runtime.str += common.TYPE_CONSTRUCTED_INSTANCE + common.TYPE_OPEN ;
	serializeString( objectData.className , runtime ) ;
	serializeAnyType( Array.isArray( objectData.args ) ? objectData.args : null , runtime ) ;

	// We should set the ref ONCE the constructor args is sent, not before,
	// because it is possible that args === v
	runtime.refs.set( v , instanceId ) ;

	if ( objectData.overrideKeys ) {
		override = objectData.override && typeof objectData.override === 'object' ? objectData.override : v ;

		for ( key of objectData.overrideKeys ) {
			if ( Object.prototype.hasOwnProperty.call( override , key ) ) {
				serializeAnyType( key , runtime ) ;
				serializeAnyType( override[ key ] , runtime ) ;
			}
		}
	}
	else if ( objectData.override && typeof objectData.override === 'object' ) {
		keys = Object.keys( objectData.override ) ;

		for ( key of keys ) {
			serializeAnyType( key , runtime ) ;
			serializeAnyType( objectData.override[ key ] , runtime ) ;
		}
	}

	runtime.str += common.TYPE_CLOSE ;
}



function serializeDate( v , runtime ) {
	runtime.str += common.TYPE_DATE + v.getTime() + common.TYPE_SEPARATOR ;
}



function serializeBuffer( v , runtime ) {
	var str = v.toString( 'base64' ) ;
	runtime.str += common.TYPE_BUFFER + str.length + common.TYPE_SEPARATOR + str + common.TYPE_SEPARATOR ;
}

