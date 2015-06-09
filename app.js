#!/usr/bin/env node

var path = require('path')
var args = process.argv.slice(2)
var from = Number(args[0])
var num = Number(args[1])
var to = from + num - 1
var dir = path.resolve(args[2] || './blocks')
var BlockLoader = require('./').BlockLoader

new BlockLoader(dir)
  .from(from)
  .to(to)
  .start()
