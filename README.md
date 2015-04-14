# blockloader

cache blocks on file system, provide (extremely incomplete) common blockchain interface to them

## Usage

```bash
# fetch 10 blocks starting with 330404
./app.js 330404 10
```

```js
var stuff = require('./')
var BlockLoader = stuff.BlockLoader
var Blockchain = stuff.Blockchain

new Blockchain('testnet').get([330404, 330405, 3304010, 330500], function(err, blocks) {
  // do stuff with blocks
  // next time these blocks will be fetched from the filesystem
})
```
