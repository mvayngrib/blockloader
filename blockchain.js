var fs = require('fs')
var assert = require('assert')
var BlockLoader = require('./blockloader')
var path = require('path')
var parallel = require('run-parallel')

function Blockchain (options) {
  if (typeof options === 'string') options = { dir: options }

  assert(options.dir, 'dir is required')
  this._dir = options.dir
  this._blockLoader = options.loader || new BlockLoader(options)
  this.blocks.get = this.blocks.get.bind(this)
}

Blockchain.prototype.blocks = {
  get: function (heights, cb) {
    var self = this

    this._blockLoader
      .heights(heights)
      .start(function (err) {
        if (err) return cb(err)

        parallel(heights.map(function (height) {
          var bPath = path.join(path.resolve(self._dir), '' + height)
          return fs.readFile.bind(fs, bPath)
        }), function (err, results) {
          if (err) return cb(err)

          results = Array.isArray(heights) ? results : results[0]
          cb(null, results)
        })

      })
  }
}

module.exports = Blockchain
