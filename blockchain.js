
var levelup = require('levelup')
var assert = require('assert')
var bitcoin = require('bitcoinjs-lib')
var BlockLoader = require('./blockloader')
var path = require('path')
var parallel = require('run-parallel')

function Blockchain(options) {
  if (typeof options === 'string') options = { dir: options }

  assert(options.dir, '"dir" is required')
  assert(options.leveldown, '"leveldown" is required')

  this._dir = options.dir
  this._blockLoader = new BlockLoader(options)
  this.blocks.get = this.blocks.get.bind(this)
}

Blockchain.prototype.blocks = {
  get: function(heights, cb) {
    var self = this

    this._blockLoader
      .heights(heights)
      .start(function(err) {
        if (err) return cb(err)

        var tasks = heights.map(self._blockLoader.fromDB, self._blockLoader)
        parallel(tasks, function(err, results) {
          if (err) return cb(err)

          results = Array.isArray(heights) ? results : results[0]
          cb(null, results)
        })

      })
  }
}

module.exports = Blockchain
