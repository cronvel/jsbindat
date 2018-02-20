# TOC
   - [basic serialization/unserialization features](#basic-serializationunserialization-features)
   - [Instances](#instances)
   - [References and relational structures](#references-and-relational-structures)
<a name=""></a>
 
<a name="basic-serializationunserialization-features"></a>
# basic serialization/unserialization features
undefined.

```js
mutualTest( undefined ).then( done , done ) ;
```

null.

```js
mutualTest( null ).then( done , done ) ;
```

false.

```js
mutualTest( false ).then( done , done ) ;
```

true.

```js
mutualTest( true ).then( done , done ) ;
```

real-world test.

```js
mutualTest( require( '../sample/sample1.json' ) ).then( done , done ) ;
```

<a name="instances"></a>
# Instances
constructed instances, using a 'new' type of constructor.

```js
function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}
		ZeClass.serializer = function( obj ) {
			return [ obj ] ;
		} ;
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;
		var options = {
			classMap: {
				ZeClass: ZeClass
			}
		} ;
		var data = {
			v: new ZeClass() ,
			v2: new ZeClass()
		} ;
		data.v2.inc() ;
		mutualTest( data , options , options , udata => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
```

constructed instances, using a 'new' type of constructor with arguments.

```js
function ZeClass( arg1 , arg2 ) {
			this.arg1 = arg1 ;
			this.arg2 = arg2 ;
			this.a = 4 ;
			this.b = 7 ;
		}
		ZeClass.serializer = function( obj ) {
			return [ obj.arg1 , obj.arg2 , { a: obj.a , b: obj.b } ] ;
		} ;
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;
		var options = {
			classMap: {
				ZeClass: ZeClass
			}
		} ;
		var data = {
			v: new ZeClass( "arg1" , 2 ) ,
			v2: new ZeClass( { arg: 1 } , [ 2 ] )
		} ;
		data.v2.inc() ;
		mutualTest( data , options , options , ( udata ) => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
```

constructed instances, using a regular function as constructor.

```js
function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;
		var options = {
			classMap: {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) { return [ obj ] ; } ,
					unserializer: function() { return new ZeClass() ; }
				}
			}
		} ;
		var data = {
			v: new ZeClass() ,
			v2: new ZeClass()
		} ;
		data.v2.inc() ;
		mutualTest( data , options , options , ( udata ) => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
```

constructed instances, using a regular function as constructor, with arguments.

```js
function ZeClass( arg1 , arg2 ) {
			this.arg1 = arg1 ;
			this.arg2 = arg2 ;
			this.a = 4 ;
			this.b = 7 ;
		}
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;
		var options = {
			classMap: {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) {
						return [ obj.arg1 , obj.arg2 , { a: obj.a , b: obj.b } ] ;
					} ,
					unserializer: function( arg1 , arg2 ) { return new ZeClass( arg1 , arg2 ) ; }
				}
			}
		} ;
		var data = {
			v: new ZeClass( "arg1" , 2 ) ,
			v2: new ZeClass( { arg: 1 } , [ 2 ] )
		} ;
		data.v2.inc() ;
		mutualTest( data , options , options , ( udata ) => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
		} ).then( done , done ) ;
```

<a name="references-and-relational-structures"></a>
# References and relational structures
references (no duplicated object).

```js
var data = {
			doc1: { a: 1 , b: 2 } ,
			doc2: { a: 4 , b: 7 } ,
			doc3: {} ,
			doc4: { mlinks: [] } ,
			doc5: {}
		} ;
		data.circular = data ;
		data.doc1.link = data.doc3 ;
		data.doc2.link = data.doc1 ;
		data.doc5.mlinks = [ data.doc1 , data.doc3 , data ] ;
		mutualTest( data , ( udata ) => {
			doormen.equals( udata.circular === udata , true ) ;
			doormen.equals( udata.doc2.link === udata.doc1 , true ) ;
			doormen.equals( udata.doc2.link === udata.doc1 , true ) ;
			doormen.equals( udata.doc5.mlinks[ 0 ] === udata.doc1 , true ) ;
			doormen.equals( udata.doc5.mlinks[ 1 ] === udata.doc3 , true ) ;
			doormen.equals( udata.doc5.mlinks[ 2 ] === udata , true ) ;
		} ).then( done , done ) ;
```

instances without constructor self referencing itself and other instances.

```js
function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;
		var options = {
			classMap: {
				ZeClass: ZeClass
			}
		} ;
		var data = {
			v: new ZeClass() ,
			v2: new ZeClass()
		} ;
		data.v2.inc() ;
		data.v.root = data ;
		data.v.self = data.v ;
		data.v.v2 = data.v2 ;
		data.v2.v = data.v ;
		data.v3 = data.v2 ;
		mutualTest( data , options , options , ( udata ) => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
			doormen.equals( udata.v.root === udata , true ) ;
			doormen.equals( udata.v.self === udata.v , true ) ;
			doormen.equals( udata.v.v2 === udata.v2 , true ) ;
			doormen.equals( udata.v2.v === udata.v , true ) ;
			doormen.equals( udata.v3 === udata.v2 , true ) ;
		} ).then( done , done ) ;
```

instances with constructor self referencing itself and other instances.

```js
function ZeClass() {
			this.a = 4 ;
			this.b = 7 ;
		}
		ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; } ;
		var options = {
			classMap: {
				ZeClass: {
					prototype: ZeClass.prototype ,
					serializer: function( obj ) {
						// Back up anything except constructor args
						var clone = Object.assign( {} , obj ) ;
						delete clone.arg1 ;
						delete clone.arg2 ;
						return [ obj.arg1 , obj.arg2 , clone ] ;
					} ,
					unserializer: function( arg1 , arg2 ) { return new ZeClass( arg1 , arg2 ) ; }
				}
			}
		} ;
		var data = {
			v: new ZeClass() ,
			v2: new ZeClass()
		} ;
		data.v2.inc() ;
		data.v.root = data ;
		data.v.self = data.v ;
		data.v.v2 = data.v2 ;
		data.v2.v = data.v ;
		data.v3 = data.v2 ;
		mutualTest( data , options , options , ( udata ) => {
			doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
			doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
			doormen.equals( udata.v.root === udata , true ) ;
			doormen.equals( udata.v.self === udata.v , true ) ;
			doormen.equals( udata.v.v2 === udata.v2 , true ) ;
			doormen.equals( udata.v2.v === udata.v , true ) ;
			doormen.equals( udata.v3 === udata.v2 , true ) ;
		} ).then( done , done ) ;
```

