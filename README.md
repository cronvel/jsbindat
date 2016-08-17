

# JS Binary Data

Binary data serializer and unserializer for Node.js.

Early alpha.

Write sliced! 9
# TOC
   - [basic features](#basic-features)
<a name=""></a>
 
<a name="basic-features"></a>
# basic features
basic test.

```js
var serialize = jsbindat.serializer( {} ) ;
var stream = fs.createWriteStream( './out.jsdat' ) ;
//serialize( undefined , stream ) ;

serialize( 'toto' , stream , function() {
	stream.end( done ) ;
} ) ;
```

