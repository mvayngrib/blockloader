var test = require('tape')
var batchify = require('../batchify')

test('batches', function (t) {
  t.plan(10)

  runTests(t)
  runTests(t, true)
})

function runTests (t, async) {
  var batchy = batchify
  if (async) {
    batchy = function (from, to, skipTest, cb) {
      var args1 = [].slice.call(arguments)
      args1[2] = function () {
        var args2 = arguments
        var self = this
        process.nextTick(function () {
          skipTest.apply(self, args2)
        })
      }

      return batchify.apply(this, args1)
    }
  }

  t.throws(batchy.bind(null, 0, -1, function () {}, function () {}))

  batchy(0, 10, function (n, cb) {
    cb(true)
  }, function (batches) {
    t.deepEqual(batches, [])
  })

  batchy(0, 1, function (n, cb) {
    cb(false)
  }, function (batches) {
    t.deepEqual(batches, [
      [0, 1]
    ])
  })

  batchy(0, 10, function (n, cb) {
    cb(true)
  }, function (batches) {
    t.deepEqual(batches, [])
  })

  batchy(0, 7, function (n, cb) {
    cb(n % 3 === 0)
  }, function (batches) {
    t.deepEqual(batches, [
      [1, 2], [4, 5], [7, 7]
    ])
  })
}
