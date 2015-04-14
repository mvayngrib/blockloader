#!/usr/bin/env node

var fs = require('fs')
var mkdirp = require('mkdirp')
var Walker = require('tx-walker')
var path = require('path')
var args = process.argv.slice(2)
var from = Number(args[0])
var num = Number(args[1])
var to = from + num
var dir = path.resolve(args[2] || './blocks')
var BlockLoader = require('./').BlockLoader

new BlockLoader(dir)
  .from(from)
  .to(to)
  .start()
