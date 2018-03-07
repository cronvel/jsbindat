

# JS Binary Data

Binary data serializer and unserializer for Node.js.

Beta.

Serialize and unserialize any Javascript data.

Supports:

* All Javascript basic types: undefined, null, boolean, number, string, array and object
* ES6 Set and Map
* Relational data & circular references: no object duplication, the output structure is the same than the input was
* Prototype chain is supported (require the 'prototypeChain' serializer option)
* Instance of non-trivial object are supported, if a map of names to prototype/constructor is provided (require the 'classMap'
  option to be set to a common object/map on both the serializer and unserializer)



### Serializing to a file example

```js
var stream = fs.createWriteStream( 'path/to/my/file.jsdat' ) ;
await jsbindat.serialize( stream , data ) ;
```

... or just:

```js
await jsbindat.writeFile( 'path/to/my/file.jsdat' , data ) ;
```



### Unserializing from a file example

```js
var stream = fs.createReadStream( 'path/to/my/file.jsdat' ) ;
var data = await jsbindat.unserialize( stream ) ;
stream.close() ;
// Do something with the data
```

... or just:

```js
var data = jsbindat.readFile( 'path/to/my/file.jsdat' ) ;
```



### Non-trivial object

TODO: documentation


