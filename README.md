

# JS Binary Data

Binary data serializer and unserializer for Node.js.

Beta.

Serialize and unserialize any Javascript data.

Supports:

* All Javascript types: undefined, null, boolean, number, string, array and object
* Relational data, circular references: once unserialized, there is no object duplication
* Serialize/unserialize instance of non-trivial object



### Serializing to a file example

```
var stream = fs.createWriteStream( 'path/to/my/file.jsdat' ) ;

jsbindat.serialize( data , stream , {} , function() {
	stream.end() ;
} ) ;
```



### Unserializing from a file example

```
var stream = fs.createReadStream( 'path/to/my/file.jsdat' ) ;

jsbindat.unserialize( stream , {} , function( data ) {
	
	// Do something with the 
} ) ;
```



### Non-trivial object

TODO: documentation



### BDD Spec

# TOC
   - [basic serialization/unserialization features](#basic-serializationunserialization-features)
   - [Instances](#instances)
   - [References and relational structures](#references-and-relational-structures)
<a name=""></a>
 
<a name="basic-serializationunserialization-features"></a>
# basic serialization/unserialization features
undefined.

```js
mutualTest( undefined , done ) ;
```

null.

```js
mutualTest( null , done ) ;
```

false.

```js
mutualTest( false , done ) ;
```

true.

```js
mutualTest( true , done ) ;
```

numbers.

```js
var samples = [
	0 , 1 , 123 , 123456789 , 0.123 , 123.456 , -1 , -123456789 , -0.123 , -123.456 ,
	Infinity , -Infinity , NaN ] ;

async.foreach( samples , function( data , foreachCallback ) {
	mutualTest( data , foreachCallback ) ;
} )
.exec( done ) ;
```

strings.

```js
var samples = [
	'' ,
	'a' ,
	'a string' ,
	'a'.repeat( 32 ) ,
	'a'.repeat( 64 ) ,
	'a'.repeat( 128 ) ,
	'a'.repeat( 256 ) ,
	'a'.repeat( 512 ) ,
	'this is a really really really big big big string!'.repeat( 100 ) ,
	'this is a really really really big big big string!'.repeat( 2000 ) ,
	'this is a really really really big big big string!'.repeat( 200000 ) ,
] ;

async.foreach( samples , function( data , foreachCallback ) {
	mutualTest( data , foreachCallback ) ;
} )
.exec( done ) ;
```

arrays.

```js
var samples = [
	[] ,
	[ true , false ] ,
	[ 1 , 2 , 3 , true , false , null , 'a string' , 'another string' ]
] ;

async.foreach( samples , function( data , foreachCallback ) {
	mutualTest( data , foreachCallback ) ;
} )
.exec( done ) ;
```

nested arrays.

```js
var samples = [
	[
		[ 1 , 2 , 3 ] ,
		[ true , false ] ,
		[ null , 'another string' , 'this is a really really really big big big string!'.repeat( 100 ) , 'a string' ]
	]
] ;

async.foreach( samples , function( data , foreachCallback ) {
	mutualTest( data , foreachCallback ) ;
} )
.exec( done ) ;
```

objects.

```js
var big = 'this is a really really really big big big string!'.repeat( 100 ) ;

var samples = [
	{} ,
	{ a: 1 , b: 2 } ,
	{ a: 1 , b: 2 , c: true , d: 'a string' , f: 'big' , abcdefghijklmnopq: true , g: 'gee' } ,
	{ a: 1 , b: 2 , c: true , d: 'a string' , f: big , abcdefghijklmnopq: true , g: 'gee' }
] ;

// Big key
samples[ samples.length - 1 ][ big ] = big ;
samples[ samples.length - 1 ].notbig = 'notbigstring' ;

async.foreach( samples , function( data , foreachCallback ) {
	mutualTest( data , foreachCallback ) ;
} )
.exec( done ) ;
```

nested objects.

```js
var samples = [
	{
		sub: { a: 1, sub: {} } ,
		sub2: { b: 2, sub: { sub: { sub: { c: 3 } } } } ,
		d: 4
	}
] ;

async.foreach( samples , function( data , foreachCallback ) {
	mutualTest( data , foreachCallback ) ;
} )
.exec( done ) ;
```

nested arrays and objects.

```js
var samples = [
	{
		sub: [ 1, {} ] ,
		sub2: [ 2, { sub: { sub: { c: [ 1 , 2 , 3 ] } } } ] ,
		d: 4
	} ,
	[
		[ 1, {} ] ,
		{ b: 2, sub: { sub: { sub: { c: [ 1 , 2 , 3 ] } } } } ,
		4
	]
] ;

async.foreach( samples , function( data , foreachCallback ) {
	mutualTest( data , foreachCallback ) ;
} )
.exec( done ) ;
```

real-world test.

```js
mutualTest( require( '../sample/sample1.json' ) , done ) ;
```

<a name="instances"></a>
# Instances
instances without constructor.

```js
function ZeClass()
{
	this.a = 4 ;
	this.b = 7 ;
}

ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }

var options = {
	classMap: new ClassMap( {
		ZeClass: {
			prototype: ZeClass.prototype
		}
	} )
} ;

var data = {
	v: new ZeClass()
} ;

//console.log( 'data: ' , data ) ;

mutualTest( data , options , options , function( udata ) {
	//console.log( 'udata: ' , udata ) ;
	doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
} , done ) ;
```

constructed instances, using a 'new' type of constructor.

```js
function ZeClass()
{
	this.a = 4 ;
	this.b = 7 ;
}

ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }

var options = {
	classMap: ClassMap.create( {
		ZeClass: {
			prototype: ZeClass.prototype ,
			serializer: function( obj ) {
				return [ undefined , obj ] ;
			} ,
			newConstructor: ZeClass
		}
	} )
} ;

var data = {
	v: new ZeClass() ,
	v2: new ZeClass()
} ;

data.v2.inc() ;

//console.log( 'data: ' , deb( data ) ) ;

mutualTest( data , options , options , function( udata ) {
	//console.log( 'udata: ' , deb( udata ) ) ;
	doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
} , done ) ;
```

constructed instances, using a 'new' type of constructor with arguments.

```js
function ZeClass( arg1 , arg2 )
{
	this.arg1 = arg1 ;
	this.arg2 = arg2 ;
	this.a = 4 ;
	this.b = 7 ;
}

ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }

var options = {
	classMap: ClassMap.create( {
		ZeClass: {
			prototype: ZeClass.prototype ,
			serializer: function( obj ) {
				return [ [ obj.arg1 , obj.arg2 ] , { a: obj.a , b: obj.b } ] ;
			} ,
			newConstructor: ZeClass
		}
	} )
} ;

var data = {
	v: new ZeClass( "arg1" , 2 ) ,
	v2: new ZeClass( { arg: 1 } , [ 2 ] )
} ;

data.v2.inc() ;

//console.log( 'data: ' , deb( data ) ) ;

mutualTest( data , options , options , function( udata ) {
	//console.log( 'udata: ' , deb( udata ) ) ;
	doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
} , done ) ;
```

constructed instances, using a regular function as constructor.

```js
function ZeClass()
{
	this.a = 4 ;
	this.b = 7 ;
}

ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }

var options = {
	classMap: ClassMap.create( {
		ZeClass: {
			prototype: ZeClass.prototype ,
			serializer: function( obj ) {
				return [ undefined , obj ] ;
			} ,
			constructor: function() { return new ZeClass() ; }
		}
	} )
} ;

var data = {
	v: new ZeClass() ,
	v2: new ZeClass()
} ;

data.v2.inc() ;

//console.log( 'data: ' , deb( data ) ) ;

mutualTest( data , options , options , function( udata ) {
	//console.log( 'udata: ' , deb( udata ) ) ;
	doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
} , done ) ;
```

constructed instances, using a regular function as constructor, with arguments.

```js
function ZeClass( arg1 , arg2 )
{
	this.arg1 = arg1 ;
	this.arg2 = arg2 ;
	this.a = 4 ;
	this.b = 7 ;
}

ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }

var options = {
	classMap: ClassMap.create( {
		ZeClass: {
			prototype: ZeClass.prototype ,
			serializer: function( obj ) {
				return [ [ obj.arg1 , obj.arg2 ] , { a: obj.a , b: obj.b } ] ;
			} ,
			constructor: function( arg1 , arg2 ) { return new ZeClass( arg1 , arg2 ) ; }
		}
	} )
} ;

var data = {
	v: new ZeClass( "arg1" , 2 ) ,
	v2: new ZeClass( { arg: 1 } , [ 2 ] )
} ;

data.v2.inc() ;

//console.log( 'data: ' , deb( data ) ) ;

mutualTest( data , options , options , function( udata ) {
	//console.log( 'udata: ' , deb( udata ) ) ;
	doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
} , done ) ;
```

constructed instances, test the Date object.

```js
var options = {
	classMap: ClassMap.create( {
		Date: {
			prototype: Date.prototype ,
			constructor: function( arg ) {
				return new Date( arg ) ;
			} ,
			serializer: function( value ) {
				return [ value.getTime() ] ;
			}
		}
	} )
} ;

var samples = [
	new Date() ,
	[ new Date() , new Date() , new Date() ] ,
	{ a: new Date() , b: new Date() , c: new Date() } ,
] ;

//console.log( 'samples: ' , deb( samples ) ) ;

async.foreach( samples , function( data , foreachCallback ) {
	mutualTest( data , options , options , function( udata ) {
		//console.log( 'udata: ' , deb( udata ) ) ;
	} , foreachCallback ) ;
} )
.exec( done ) ;
```

<a name="references-and-relational-structures"></a>
# References and relational structures
references (no duplicated object).

```js
var data = {
	doc1: { a: 1, b: 2 } ,
	doc2: { a: 4, b: 7 } ,
	doc3: {} ,
	doc4: { mlinks:[] } ,
	doc5: {} ,
} ;

data.circular = data ;
data.doc1.link = data.doc3 ;
data.doc2.link = data.doc1 ;
data.doc5.mlinks = [ data.doc1 , data.doc3 , data ] ;

mutualTest( data , function( udata ) {
	doormen.equals( udata.circular === udata , true ) ;
	doormen.equals( udata.doc2.link === udata.doc1 , true ) ;
	doormen.equals( udata.doc2.link === udata.doc1 , true ) ;
	doormen.equals( udata.doc5.mlinks[ 0 ] === udata.doc1 , true ) ;
	doormen.equals( udata.doc5.mlinks[ 1 ] === udata.doc3 , true ) ;
	doormen.equals( udata.doc5.mlinks[ 2 ] === udata , true ) ;
} , done ) ;
```

instances without constructor self referencing itself and other instances.

```js
function ZeClass()
{
	this.a = 4 ;
	this.b = 7 ;
}

ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }

var options = {
	classMap: ClassMap.create( {
		ZeClass: {
			prototype: ZeClass.prototype
		}
	} )
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

//console.log( 'data: ' , deb( data ) ) ;

mutualTest( data , options , options , function( udata ) {
	//console.log( 'udata: ' , deb( udata ) ) ;
	doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
	doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
	doormen.equals( udata.v.root === udata , true ) ;
	doormen.equals( udata.v.self === udata.v , true ) ;
	doormen.equals( udata.v.v2 === udata.v2 , true ) ;
	doormen.equals( udata.v2.v === udata.v , true ) ;
	doormen.equals( udata.v3 === udata.v2 , true ) ;
} , done ) ;
```

instances with constructor self referencing itself and other instances.

```js
function ZeClass()
{
	this.a = 4 ;
	this.b = 7 ;
}

ZeClass.prototype.inc = function() { this.a ++ ; this.b ++ ; }

var options = {
	classMap: ClassMap.create( {
		ZeClass: {
			prototype: ZeClass.prototype ,
			serializer: function( obj ) {
				
				// Back up anything except constructor args
				var clone = Object.assign( {} , obj ) ;
				delete clone.arg1 ;
				delete clone.arg2 ;
				
				return [ [ obj.arg1 , obj.arg2 ] , clone ] ;
			} ,
			constructor: function( arg1 , arg2 ) { return new ZeClass( arg1 , arg2 ) ; }
		}
	} )
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

//console.log( 'data: ' , deb( data ) ) ;

mutualTest( data , options , options , function( udata ) {
	//console.log( 'udata: ' , deb( udata ) ) ;
	doormen.equals( Object.getPrototypeOf( udata.v ) === ZeClass.prototype , true ) ;
	doormen.equals( Object.getPrototypeOf( udata.v2 ) === ZeClass.prototype , true ) ;
	doormen.equals( udata.v.root === udata , true ) ;
	doormen.equals( udata.v.self === udata.v , true ) ;
	doormen.equals( udata.v.v2 === udata.v2 , true ) ;
	doormen.equals( udata.v2.v === udata.v , true ) ;
	doormen.equals( udata.v3 === udata.v2 , true ) ;
} , done ) ;
```

