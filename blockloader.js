var levelup = require('levelup')
var extend = require('extend')
var Walker = require('tx-walker')
var bitcoin = require('bitcoinjs-lib')
var path = require('path')
var assert = require('assert')
var noop = function() {}
var walkerOpts = {
  networkName: 'testnet',
  batchSize: 5,
  throttle: 5000
}

function BlockLoader(options) {
  if (typeof options === 'string') options = { dir: options }

  assert(options.dir, '"dir" is required')
  assert(options.leveldown, '"leveldown" is required')

  this._walkerOpts = extend({}, walkerOpts, options)
  this._db = levelup(options.dir, { db: options.leveldown })
}

BlockLoader.prototype.from = function(height) {
  this._from = height
  return this
}

BlockLoader.prototype.to = function(height) {
  this._to = height
  return this
}

BlockLoader.prototype.heights = function(heights, cb) {
  var self = this
  var sorted = heights.slice().sort(function(a, b) { return a - b })

  this._batches = toBatches(sorted[0], sorted[sorted.length - 1], function(i, skip) {
    if (heights.indexOf(i) === -1) return cb(true) // zalgo

    self._db.get(i, function(err) {
      skip(!err) // skip if exists
    })
  }, cb)

  return this
}

// BlockLoader.prototype._fname = function(height) {
//   return path.join(this._dir, '' + height)
// }

BlockLoader.prototype.start = function(cb) {
  var self = this
  var batches

  cb = cb || noop

  var dir = this._dir
  var from = this._from
  var to = this._to
  toBatches(from, to, function(i, skip) {
    self._db.get(i, function(err) {
      skip(!err) // skip if exists
    })
  }, function(_batches) {
    batches = self._batches = _batches
    next()
  })

  return this

  function next() {
    if (!batches.length) return cb()

    var batch = batches.shift()
    var walker = new Walker(walkerOpts)
      .from(batch.from)
      .to(batch.to)
      .on('blockend', function(block, height) {
        self._db.put(height, block.toHex())
      })
      .on('error', function(err) {
        console.log(err)
      })
      .on('stop', next)
      .start()
  }
}

function toBatches(from, to, skipTest, cb) {
  var batches = []
  var batch = {}
  var nulls = nullArray(to - from + 1)
  var togo = 0
  nulls.forEach(function(nil, i) {
    togo++
    var height = from + i
    skipTest(height, function(skip) {
      if (skip) {
        if ('from' in batch) {
          batch.to = height - 1
          batches.push(batch)
          batch = {}
        }
      }
      else {
        if (!('from' in batch)) {
          batch.from = height
        }
      }

      if (--togo === 0) {
        if ('from' in batch) {
          batch.to = height - 1
          batches.push(batch)
        }

        cb(batches)
      }
    })
  })
}

function nullArray(n) {
  var arr = []
  for (var i = 0; i < n; i++) {
    arr.push(null)
  }

  return arr
}

module.exports = BlockLoader
