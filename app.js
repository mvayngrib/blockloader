#!/usr/bin/env node

var args = process.argv.slice(2)
var from = Number(args[0])
var num = Number(args[1])
if (isNaN(from) || isNaN(num)) {
  throw new Error('Usage: app.js <fromHeight> <numBlocks>')
}

var fs = require('fs')
var Walker = require('tx-walker')
var path = require('path')
var leveldown = require('leveldown')
var to = from + num
var dir = path.resolve(args[2] || './blocks.db')
var BlockLoader = require('./').BlockLoader


new BlockLoader({
    dir: dir,
    leveldown: leveldown
  })
  .from(from)
  .to(to)
  .start()
