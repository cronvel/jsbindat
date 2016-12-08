# TOC
   - [basic serialization/unserialization features](#basic-serializationunserialization-features)
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

instances.

```js
var serializerOptions = {
	classes: new Map()
} ;

serializerOptions.classes.set( Date.prototype , function Date( v ) {
	return v.getTime() ;
} ) ;

var unserializerOptions = {
	classes: {
		Date: function( v ) {
			return new Date( v ) ;
		}
	}
} ;

var samples = [
	new Date() ,
	[ new Date() , new Date() , new Date() ] ,
	{ a: new Date() , b: new Date() , c: new Date() } ,
] ;

async.foreach( samples , function( data , foreachCallback ) {
	mutualTest( data , serializerOptions , unserializerOptions , foreachCallback ) ;
} )
.exec( done ) ;
```

instances using an object as argument.

```js
var serializerOptions = {
	classes: new Map()
} ;

serializerOptions.classes.set( Date.prototype , function Date( v ) {
	return {
		timestamp: v.getTime() ,
		string: v.toString() ,
	} ;
} ) ;

var unserializerOptions = {
	classes: {
		Date: function( v ) {
			return new Date( v.timestamp ) ;
		}
	}
} ;

var samples = [
	new Date() ,
	[ new Date() , new Date() , new Date() ] ,
	{ a: new Date() , b: new Date() , c: new Date() } ,
] ;

async.foreach( samples , function( data , foreachCallback ) {
	mutualTest( data , serializerOptions , unserializerOptions , foreachCallback ) ;
} )
.exec( done ) ;
```

relational references (no duplicated object).

```js
var data = {
	doc1: { a: 1, b: 2 } ,
	doc2: { a: 4, b: 7 } ,
	doc3: {} ,
	doc4: { mlinks:[] } ,
	doc5: {} ,
}

data.circular = data ;
data.doc1.link = data.doc3 ;
data.doc2.link = data.doc1 ;
data.doc5.mlinks = [ data.doc1 , data.doc3 , data ] ;

var serializerOptions = {
	useRef: true
} ;

var unserializerOptions = {
	useRef: true
} ;

mutualTest( data , serializerOptions , unserializerOptions , function( udata ) {
	doormen.equals( udata.circular === udata , true ) ;
	doormen.equals( udata.doc2.link === udata.doc1 , true ) ;
	doormen.equals( udata.doc2.link === udata.doc1 , true ) ;
	doormen.equals( udata.doc5.mlinks[ 0 ] === udata.doc1 , true ) ;
	doormen.equals( udata.doc5.mlinks[ 1 ] === udata.doc3 , true ) ;
	doormen.equals( udata.doc5.mlinks[ 2 ] === udata , true ) ;
} , done ) ;
```

