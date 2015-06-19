var assert = require('assert')
var bitcoin = require('bitcoinjs-lib')
var Tx = bitcoin.Transaction

function FakeChain (options) {
  assert(typeof options.networkName === 'string')

  this.networkName = options.networkName
  this.network = bitcoin.networks[this.networkName]
  this.height = options.height
  this._blocks = []
  this._writing = 0
  this.blocks = {
    get: BLOCKS.get.bind(this)
  }

  this.transactions = {
    propagate: TXS.propagate.bind(this)
  }
}

module.exports = FakeChain

FakeChain.prototype.addNewTx = function (fromPrivKey, toPrivKey, OP_RETURN) {
  // fake prev
  var prevTx = new Tx()
  prevTx.addOutput(fromPrivKey.pub.getAddress(this.network), 50000)
  var prevTxHash = prevTx.getHash()

  var tx = new Tx()
  tx.addInput(prevTxHash, 0, 0)
  tx.addOutput(toPrivKey.pub.getAddress(this.network), 40000)
  if (OP_RETURN) {
    tx.addOutput(bitcoin.scripts.nullDataOutput(OP_RETURN), 0)
  }

  tx.sign(0, fromPrivKey)
  // no need to sign fake tx
  return this.addTxs(tx)
}

FakeChain.prototype._blockAt = function (height) {
  for (var i = 0; i < this._blocks.length; i++) {
    var block = this._blocks[i]
    if (block.height === height) return block
  }
}

FakeChain.prototype.addTxs = function (txs, height) {
  txs = [].concat(txs).map(function (tx) {
    if (typeof tx === 'string') tx = bitcoin.Transaction.fromHex(tx)
    else if (Buffer.isBuffer(tx)) tx = bitcoin.Transaction.fromBuffer(tx)
    else if (!tx.toHex) {
      throw new Error('"tx" must be Transaction, Buffer or transaction hex string')
    }

    return tx
  })

  height = height || this.height || 0
  if (!this.height) this.height = height

  var block = this._blockAt(height)
  if (block) {
    block.transactions.push.apply(block.transactions, txs)
  } else {
    block = new bitcoin.Block()
    block.transactions = txs
    this.addBlock(block, height)
  }

  return this
}

FakeChain.prototype.addBlock = function (block, height) {
  assert(typeof height === 'number', 'height must be a number')

  if (typeof block === 'string') {
    block = bitcoin.Block.fromHex(block)
  } else if (Buffer.isBuffer(block)) {
    block = bitcoin.Block.fromBuffer(block)
  } else if (!block.toHex) {
    throw new Error('"block" must be Block, Buffer or block hex string')
  }

  if (typeof height === 'number') {
    block.height = height
  } else {
    block.height = this.height
    this.height++
  }

  this._blocks.push(block)
  return this
}

// FakeChain.prototype.addresses = {
// 	unspents:
// }

var TXS = {
  propagate: function (tx) {
    this.addTxs(tx)
  }
}

var BLOCKS = {
  get: function (heights, cb) {
    var self = this

    var blocks = heights.map(function (h, i) {
      return self._blocks.filter(function (b) {
        return b.height === h
      })[0]
    })
      .filter(function (b) {
        return b
      })

    if (!blocks.length) return cb(new Error('no blocks found'))

    cb(null, blocks)
  }
}
