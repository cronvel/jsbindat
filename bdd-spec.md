Write sliced! 17

typeHandler() 50 { type: 'uint8',
  key: 'type',
  handler: [Function: typeHandler],
  size: 1,
  readBufferFn: 'readUInt8' } {} [ { type: 'uint8',
    key: 'type',
    handler: [Function: typeHandler],
    size: 1,
    readBufferFn: 'readUInt8' } ]

lpsHandler() 12 { type: 'uint32',
  key: 'size',
  handler: [Function: lpsHandler],
  size: 4,
  readBufferFn: 'readUInt32BE' } { type: 50 } [ { type: 'uint8',
    key: 'type',
    handler: [Function: typeHandler],
    size: 1,
    readBufferFn: 'readUInt8' },
  { type: 'uint32',
    key: 'size',
    handler: [Function: lpsHandler],
    size: 4,
    readBufferFn: 'readUInt32BE' },
  { type: 'utf8',
    key: 'value',
    size: undefined,
    readBufferFn: 'toString' } ] 1

structured data event: { type: 50, size: 12, value: 'grigrigredin' }


>>> data: grigrigredin 


# TOC
   - [basic features](#basic-features)
<a name=""></a>
 
<a name="basic-features"></a>
# basic features
xxx basic test.

```js
var serialize = jsbindat.serializer( {} ) ;
var stream = fs.createWriteStream( __dirname + '/out.jsdat' ) ;
//serialize( undefined , stream ) ;

serialize( 'grigrigredin' , stream , function() {
//serialize( 123 , stream , function() {
	stream.end( done ) ;
} ) ;
```

zzz read test.

```js
var unserialize = jsbindat.unserializer( {} ) ;
var stream = fs.createReadStream( __dirname + '/out.jsdat' ) ;
//serialize( undefined , stream ) ;

unserialize( stream , function( data ) {
	console.log( '\n\n>>> data:' , data , '\n\n' )
	done() ;
} ) ;
```

