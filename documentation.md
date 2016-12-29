

# JS Binary Data

Binary data serializer and unserializer for Node.js.

Beta.

Serialize and unserialize any Javascript data.

Supports:

* All Javascript types: undefined, null, boolean, number, string, array and object
* Relational data, circular references: once unserialized, there is no object duplication
* Serialize/unserialize instance of non-trivial object



### Serializing to a file example

```js
var stream = fs.createWriteStream( 'path/to/my/file.jsdat' ) ;

jsbindat.serialize( stream , data , function() {
	stream.end() ;
} ) ;
```

... or just:

```js
jsbindat.writeFile( 'path/to/my/file.jsdat' , data ) ;
```



### Unserializing from a file example

```
var stream = fs.createReadStream( 'path/to/my/file.jsdat' ) ;

jsbindat.unserialize( stream , function( data ) {
	stream.close() ;
	// Do something with the data
} ) ;
```

... or just:

```js
jsbindat.readFile( 'path/to/my/file.jsdat' , function( data ) {
	// Do something with the data
} ) ;
```



### Non-trivial object

TODO: documentation



### BDD Spec

