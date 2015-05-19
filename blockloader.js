var fs = require('fs')
var mkdirp = require('mkdirp')
var extend = require('extend')
var Walker = require('tx-walker')
var path = require('path')
var assert = require('assert')
var noop = function () {}
var walkerOpts = {
  networkName: 'testnet',
  batchSize: 5,
  throttle: 5000
}

function BlockLoader (options) {
  if (typeof options === 'string') options = { dir: options }

  assert(options.dir, '"dir" is required')

  this._dir = options.dir
  this._walkerOpts = extend({}, walkerOpts, options)
  mkdirp(options.dir)
}

BlockLoader.prototype.from = function (height) {
  this._from = height
  return this
}

BlockLoader.prototype.to = function (height) {
  this._to = height
  return this
}

BlockLoader.prototype.heights = function (heights) {
  this._heights = heights
  return this
}

BlockLoader.prototype._fname = function (height) {
  return path.join(this._dir, '' + height)
}

BlockLoader.prototype.start = function (cb) {
  var self = this

  cb = cb || noop
  if (this._loading) {
    this._cb = cb
    return
  }

  var batches
  var heights = this._heights
  var from
  var to
  if (heights) {
    from = heights.reduce(function (memo, height) {
      return Math.min(memo, height)
    }, Infinity)

    to = heights.reduce(function (memo, height) {
      return Math.max(memo, height)
    }, -Infinity)
  } else {
    from = this._from
    to = this._to
  }

  toBatches(from, to, function (i, skip) {
    if (heights && heights.indexOf(i) === -1) {
      skip(true) // zalgo
    } else {
      fs.exists(self._fname(i), skip) // skip if exists
    }
  }, function (_batches) {
    batches = self._batches = _batches
    next()
  })

  return this

  function next () {
    if (!batches.length) return cb()

    var batch = batches.shift()
    new Walker(walkerOpts)
      .from(batch.from)
      .to(batch.to)
      .on('blockend', function (block, height) {
        fs.writeFile(self._fname(height), block.toHex())
      })
      .on('error', function (err) {
        console.log(err)
      })
      .on('stop', next)
      .start()
  }
}

function toBatches (from, to, skipTest, cb) {
  var batches = []
  var batch = {}
  var nulls = nullArray(to - from + 1)
  var togo = 0
  nulls.forEach(function (nil, i) {
    togo++
    var height = from + i
    skipTest(height, function (skip) {
      if (skip) {
        if ('from' in batch) {
          batch.to = height - 1
          batches.push(batch)
          batch = {}
        }
      } else {
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

function nullArray (n) {
  var arr = []
  for (var i = 0; i < n; i++) {
    arr.push(null)
  }

  return arr
}

module.exports = BlockLoader
