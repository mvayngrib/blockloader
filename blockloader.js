var fs = require('fs')
var mkdirp = require('mkdirp')
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

  assert(options.dir, 'dir is required')

  this._walkerOpts = extend({}, walkerOpts, options)
  this._dir = options.dir
  mkdirp.sync(this._dir)
}

BlockLoader.prototype.from = function(height) {
  this._from = height
  return this
}

BlockLoader.prototype.to = function(height) {
  this._to = height
  return this
}

BlockLoader.prototype.heights = function(heights) {
  var self = this
  var sorted = heights.slice().sort(function(a, b) { return a - b })

  this._batches = toBatches(sorted[0], sorted[sorted.length - 1], function(i) {
    return heights.indexOf(i) === -1 || fs.existsSync(self._fname(i))
  })

  return this
}

BlockLoader.prototype._fname = function(height) {
  return path.join(this._dir, '' + height)
}

BlockLoader.prototype.start = function(cb) {
  var self = this

  cb = cb || noop

  var dir = this._dir
  var from = this._from
  var to = this._to
  var batches = this._batches || toBatches(from, to, function(i) {
    return fs.existsSync(self._fname(i))
  })

  next()
  return this

  function next() {
    if (!batches.length) return cb()

    var batch = batches.shift()
    var walker = new Walker(walkerOpts)
      .from(batch.from)
      .to(batch.to)
      .on('blockend', function(block, height) {
        fs.writeFile(self._fname(height), block.toHex())
      })
      .on('error', function(err) {
        console.log(err)
      })
      .on('stop', next)
      .start()
  }
}

function toBatches(from, to, skipTest) {
  var batches = []
  var batch = {}

  for (var i = from; i <= to; i++) {
    if (skipTest(i)) {
      if ('from' in batch) {
        batch.to = i - 1
        batches.push(batch)
        batch = {}
      }
    }
    else {
      if (!('from' in batch)) {
        batch.from = i
      }
    }
  }

  if ('from' in batch) {
    batch.to = i - 1
    batches.push(batch)
  }

  return batches
}

module.exports = BlockLoader
